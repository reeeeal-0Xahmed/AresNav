#!/usr/bin/env python3
"""Real USGS elevations -> whole Trek viewport, regional 200 m planning only."""
import argparse
import json
import math
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlparse

import numpy as np
from pyproj import CRS, Transformer
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject, transform_bounds
from rasterio.windows import Window, from_bounds
from scipy.ndimage import binary_dilation, uniform_filter

SOURCE_URL = 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif'
REFERENCE = 'https://astrogeology.usgs.gov/search/map/mars_mgs_mola_mex_hrsc_blended_dem_global_200m'
DEFAULT_TREK_URL = 'https://trek.nasa.gov/mars/#v=0.1&x=77.42982155&y=18.46611095&z=9&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104905&d=&locale=&b=mars&e=76.80291421306124%2C17.96348644765699%2C78.05672888693876%2C18.96873545234301&sfz=&w='
RADIUS = 3396190.0


def log(text):
    print(text, file=sys.stderr, flush=True)


def parse_extent(url):
    parsed = urlparse(url)
    if parsed.hostname != 'trek.nasa.gov' or not parsed.path.startswith('/mars/'):
        raise ValueError('الرابط يجب أن يكون Mars Trek الرسمي.')
    params = parse_qs(parsed.fragment)
    try:
        west, south, east, north = map(float, params['e'][0].split(','))
    except (KeyError, ValueError, IndexError):
        raise ValueError('الرابط لا يحتوي حدود e صالحة.')
    if not all(map(math.isfinite, [west, south, east, north])) or not (-180 <= west < east <= 180 and -90 < south < north < 90):
        raise ValueError('نطاق غير صالح أو يعبر خط تغيير longitude؛ هذه النسخة لا تدعم عبوره.')
    return {'west': west, 'south': south, 'east': east, 'north': north}


def bands(array, limits):
    out = np.ones(array.shape, dtype=np.int16)
    for threshold, cost in zip(limits, (2, 4, 8)):
        out[array >= threshold] = cost
    return out


def run(args):
    if not math.isfinite(args.cell_m) or args.cell_m < 200:
        raise ValueError('المصدر اسميًا 200 م؛ هذه النسخة تمنع إخراج شبكة أدق زائفة.')
    if not (10 < args.block_slope_deg < 90) or not math.isfinite(args.block_localdev_m) or args.block_localdev_m <= 60:
        raise ValueError('حدود النموذج يجب أن تتجاوز آخر درجات التكلفة: الميل >10، والانحراف المحلي >60 م.')
    extent = parse_extent(args.trek_url)
    center_lon = (extent['west'] + extent['east']) / 2
    center_lat = (extent['south'] + extent['north']) / 2
    geographic = CRS.from_proj4(f'+proj=longlat +R={RADIUS} +no_defs')
    metric = CRS.from_proj4(f'+proj=eqc +lat_ts={center_lat} +lon_0={center_lon} +lat_0={center_lat} +R={RADIUS} +units=m +no_defs')
    project = Transformer.from_crs(geographic, metric, always_xy=True)
    inverse = Transformer.from_crs(metric, geographic, always_xy=True)
    xmin, ymin = project.transform(extent['west'], extent['south'])
    xmax, ymax = project.transform(extent['east'], extent['north'])
    width, height = math.ceil((xmax - xmin) / args.cell_m), math.ceil((ymax - ymin) / args.cell_m)
    if width * height > 1_000_000:
        raise ValueError('شبكة أكبر من مليون خلية؛ زِد حجم خلية التخطيط بدل رفع الحد بلا تصميم جديد.')
    # Symmetric sub-cell padding: all cell centers remain inside requested bounds.
    xpad = (width * args.cell_m - (xmax - xmin)) / 2
    ypad = (height * args.cell_m - (ymax - ymin)) / 2
    left, top = xmin - xpad, ymax + ypad
    transform = from_origin(left, top, args.cell_m, args.cell_m)
    halo = 4  # Mean radius2 + slope radius1 + blocked buffer1; no artificial map border.
    halo_transform = from_origin(left - halo * args.cell_m, top + halo * args.cell_m, args.cell_m, args.cell_m)
    hw, hh = width + 2 * halo, height + 2 * halo
    halo_bounds = (halo_transform.c, halo_transform.f - hh * args.cell_m,
                   halo_transform.c + hw * args.cell_m, halo_transform.f)
    args.out.mkdir(parents=True, exist_ok=True)
    cache = args.out / 'native_source_window.tif'
    cache_metadata_file = args.out / 'native_source_window_metadata.json'
    cache_key = {'source': args.source, 'extent': extent, 'cellSizeMeters': args.cell_m}
    cache_metadata = json.loads(cache_metadata_file.read_text()) if cache_metadata_file.exists() else None
    use_cache = (cache.exists() and not args.refresh and isinstance(cache_metadata, dict)
                 and cache_metadata.get('key') == cache_key)
    source = str(cache) if use_cache else args.source
    log(f'النطاق كاملًا: {width} × {height}، خلية {args.cell_m} م؛ مساحة نحو {(xmax-xmin)/1000:.2f} × {(ymax-ymin)/1000:.2f} كم.')
    env = dict(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.tif,.tiff',
               GDAL_HTTP_TIMEOUT='90', GDAL_HTTP_CONNECTTIMEOUT='30', GDAL_HTTP_MAX_RETRY='3',
               GDAL_HTTP_RETRY_DELAY='2', GDAL_CACHEMAX=128,
               CPL_VSIL_CURL_CHUNK_SIZE='1048576', CPL_VSIL_CURL_CACHE_SIZE='134217728')
    with rasterio.Env(**env):
        with rasterio.open(source) as src:
            if src.count != 1 or src.crs is None:
                raise ValueError('المصدر يجب أن يكون DEM أحادي الطبقة وله مرجع إحداثيات.')
            radius = CRS.from_wkt(src.crs.to_wkt()).ellipsoid.semi_major_metre
            if not math.isclose(radius, RADIUS, abs_tol=1):
                raise ValueError('المصدر ليس مرجع المريخ؛ لن نستخدم EPSG:4326 الخاص بالأرض.')
            sb = transform_bounds(metric.to_wkt(), src.crs, *halo_bounds, densify_pts=21)
            floating = from_bounds(*sb, transform=src.transform)
            x0, y0 = max(0, math.floor(floating.col_off)-3), max(0, math.floor(floating.row_off)-3)
            x1 = min(src.width, math.ceil(floating.col_off+floating.width)+3)
            y1 = min(src.height, math.ceil(floating.row_off+floating.height)+3)
            if x1 <= x0 or y1 <= y0:
                raise ValueError('النطاق خارج المصدر.')
            values = np.full((y1-y0, x1-x0), np.nan, dtype=np.float32)
            log(f'قراءة نافذة الارتفاع {x1-x0} × {y1-y0} فقط. قد تُنقل شرائح أكبر من القص بسبب تخطيط GeoTIFF.')
            for row in range(y0, y1, 16):
                count = min(16, y1-row)
                band = src.read(1, window=Window(x0, row, x1-x0, count), masked=True)
                block = band.astype(np.float32).filled(np.nan) * float(src.scales[0]) + float(src.offsets[0])
                values[row-y0:row-y0+count] = block
                log(f'قراءة المصدر: {row-y0+count}/{y1-y0} صفًا.')
            source_transform = src.window_transform(Window(x0, y0, x1-x0, y1-y0))
            source_crs = src.crs.to_wkt()
            source_info = {'originalUrl': SOURCE_URL, 'referencePage': REFERENCE,
                           'nominalPixelSpacingMeters': 200, 'sourceType': 'published_HRSC_MOLA_blend_v2',
                           'sourceWindow': {'x': x0, 'y': y0, 'width': x1-x0, 'height': y1-y0},
                           'independent200mMeasurementsEverywhere': False}
    if use_cache:
        source_info = cache_metadata['source']
    else:
        with rasterio.open(cache, 'w', driver='GTiff', width=values.shape[1], height=values.shape[0],
                           count=1, dtype='float32', crs=source_crs, transform=source_transform,
                           nodata=np.nan, compress='deflate', tiled=True) as dst:
            dst.write(values, 1); dst.set_band_unit(1, 'm')
        cache_metadata_file.write_text(json.dumps({'key': cache_key, 'source': source_info}, indent=2)+'\n')
    elevation_halo = np.full((hh, hw), np.nan, dtype=np.float32)
    reproject(source=values, destination=elevation_halo, src_transform=source_transform,
              src_crs=source_crs, src_nodata=np.nan, dst_transform=halo_transform,
              dst_crs=metric.to_wkt(), dst_nodata=np.nan, resampling=Resampling.average,
              num_threads=2, init_dest_nodata=True)
    valid = np.isfinite(elevation_halo)
    if not valid.any():
        raise ValueError('لا توجد ارتفاعات حقيقية؛ لن تُختلق بيانات بديلة.')
    safe = np.where(valid, elevation_halo, 0).astype(np.float64)
    fraction = uniform_filter(valid.astype(np.float64), size=5, mode='constant', cval=0)
    local_mean = np.divide(uniform_filter(safe, size=5, mode='constant', cval=0), fraction,
                           out=np.zeros_like(safe), where=fraction>0)
    complete = valid & (fraction >= 1 - 1e-10)
    gy, gx = np.gradient(safe, args.cell_m, args.cell_m)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    deviation = np.abs(safe - local_mean)
    raw = ~complete | (slope >= args.block_slope_deg) | (deviation >= args.block_localdev_m)
    buffered = binary_dilation(raw, structure=np.array([[0,1,0],[1,1,1],[0,1,0]], dtype=bool))
    crop = np.s_[halo:halo+height, halo:halo+width]
    z = elevation_halo[crop].copy(); valid_final = valid[crop]
    s = slope[crop]; d = deviation[crop]; blocked = buffered[crop]
    grid = np.maximum(bands(s, (2,5,10)), bands(d, (10,30,60)))
    grid[blocked] = -1
    west, north = inverse.transform(left, top)
    east, south = inverse.transform(left+width*args.cell_m, top-height*args.cell_m)
    metadata = {
        'mapId': 'jezero-regional-200m', 'model': 'experimental_regional_slope_and_local_mean_deviation',
        'navigationScale': 'regional', 'notFlightCertified': True,
        'cellSizeMeters': args.cell_m, 'width': width, 'height': height,
        'areaSizeMeters': {'width': width*args.cell_m, 'height': height*args.cell_m},
        'center': {'lon': center_lon, 'lat': center_lat}, 'crsWkt': metric.to_wkt(),
        'affine': list(transform)[:6], 'rowOrder': 'north_to_south',
        'projection': {'type': 'mars_spherical_equirectangular', 'radiusMeters': RADIUS,
                       'standardParallelDegrees': center_lat, 'centralLongitudeDegrees': center_lon,
                       'latitudeOriginDegrees': center_lat},
        'requestedBounds': extent, 'rasterBounds': {'west': west, 'south': south, 'east': east, 'north': north},
        'requestedTrekUrl': args.trek_url, 'selectionPolicy': 'entire_url_e_extent_with_symmetric_subcell_padding',
        'haloCells': halo, 'source': source_info,
        'elevationReference': 'published USGS HRSC/MOLA blend topography; not height above local ground',
        'elevationStatistics': {'validCells': int(valid_final.sum()), 'missingCells': int((~valid_final).sum()),
                                'minMeters': float(z[valid_final].min()), 'maxMeters': float(z[valid_final].max()),
                                'meanMeters': float(z[valid_final].mean())},
        'thresholds': {'blockedSlopeGreaterOrEqualDegrees': args.block_slope_deg,
                       'blockedLocalDeviationGreaterOrEqualMeters': args.block_localdev_m,
                       'localMeanWindowPlanningCells': 5, 'localMeanWindowNominalMeters': 5*args.cell_m,
                       'safetyBufferMeters': args.cell_m, 'slopeCostBreaksDegrees': [2,5,10],
                       'localDeviationCostBreaksMeters': [10,30,60]},
        'counts': {'totalPlanningCells': width*height, 'blockedPlanningCells': int(blocked.sum()),
                   'unknownPlanningCells': int((~complete[crop]).sum()),
                   'byCost': {str(int(c)): int((grid==c).sum()) for c in np.unique(grid)}},
        'warnings': ['Regional planning only, not small-rock or rover-scale hazard detection.',
                     '200 m is nominal raster spacing, not independent measurement accuracy at every cell.',
                     'Thresholds and a one-cell safety buffer are project assumptions, not NASA flight limits.',
                     'Negative elevations are normal; elevation sign and global mean do not define obstacles.',
                     'Physical slope accuracy varies with source coverage, interpolation and blend artifacts.',
                     'Routes connect snapped cell centers; user-selected positions are not exact rover waypoints.'],
    }
    payload = {'width': width, 'height': height, 'grid': grid.tolist(), 'terrainMetadata': metadata}
    args.terrain.parent.mkdir(parents=True, exist_ok=True)
    args.terrain.write_text(json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(',',':'))+'\n')
    (args.out/'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, allow_nan=False, indent=2)+'\n')
    np.savez_compressed(args.out/'terrain_analysis.npz', elevations=z, valid=valid_final,
                        grid=grid, slope_degrees=s.astype(np.float32), local_deviation_m=d.astype(np.float32))
    with rasterio.open(args.out/'elevations.tif', 'w', driver='GTiff', width=width, height=height,
                       count=1, dtype='float32', crs=metric.to_wkt(), transform=transform,
                       nodata=np.nan, compress='deflate', tiled=True) as dst:
        dst.write(z,1); dst.set_band_unit(1,'m')
    elevation_payload = {'dataType': 'elevation_not_obstacle_cost', 'mapId': metadata['mapId'],
                         'width': width, 'height': height, 'cellSizeMeters': args.cell_m,
                         'elevationUnit': 'm', 'projection': metadata['projection'],
                         'affine': metadata['affine'], 'requestedBounds': extent,
                         'rasterBounds': metadata['rasterBounds'], 'source': source_info,
                         'elevations': [[float(value) if math.isfinite(float(value)) else None for value in row] for row in z]}
    (args.out/'elevations.json').write_text(json.dumps(elevation_payload, allow_nan=False, separators=(',',':'))+'\n')
    print(json.dumps({'status':'success','terrainFile':str(args.terrain.resolve()),
                      'width':width,'height':height,'cellSizeMeters':args.cell_m,
                      'requestedBounds':extent,'elevationStatistics':metadata['elevationStatistics'],
                      'counts':metadata['counts']},ensure_ascii=False,indent=2))


def main():
    p=argparse.ArgumentParser(description='جلب كامل نطاق Mars Trek وتحويله إلى شبكة تخطيط إقليمية من ارتفاعات USGS الحقيقية')
    p.add_argument('--trek-url',default=DEFAULT_TREK_URL)
    p.add_argument('--source',default=SOURCE_URL)
    p.add_argument('--cell-m',type=float,default=200)
    p.add_argument('--block-slope-deg',type=float,default=20)
    p.add_argument('--block-localdev-m',type=float,default=80)
    p.add_argument('--refresh',action='store_true',help='إعادة قراءة المصدر بدل القص المحلي المحفوظ')
    p.add_argument('--out',type=Path,default=Path('regional_data'))
    p.add_argument('--terrain',type=Path,default=Path('terrain.json'))
    a=p.parse_args()
    try: run(a); return 0
    except Exception as e:
        print(json.dumps({'status':'error','message':str(e)},ensure_ascii=False),file=sys.stderr); return 1


if __name__=='__main__':
    raise SystemExit(main())
