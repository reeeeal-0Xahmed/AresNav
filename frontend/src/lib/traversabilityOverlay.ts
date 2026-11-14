import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Bounds } from '../api/types';
import { MARS_PROJECTION } from './marsProjection';

// Cost colors matching backend legend (-1: blocked, 1: low, 2: moderate, 4: high, 8: very_high)
const COST_COLORS: Record<number, [number, number, number, number]> = {
  [-1]: [220, 38, 38, 190],   // Red (Blocked / Cliff)
  [1]: [34, 197, 94, 60],     // Light Green (Low traversal penalty)
  [2]: [234, 179, 8, 90],     // Yellow (Moderate)
  [4]: [249, 115, 22, 140],   // Orange (High)
  [8]: [180, 83, 9, 180],     // Dark Rust / Brown (Very High)
};

/**
 * Creates an OpenLayers ImageLayer rendering the 353x298 traversability cost grid
 * exactly aligned with raster_bounds.
 */
export function createTraversabilityLayer(
  grid: number[][],
  width: number,
  height: number,
  rasterBounds: Bounds
): ImageLayer<Static> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const row = grid[y];
      for (let x = 0; x < width; x++) {
        const cost = row ? row[x] : 1;
        const color = COST_COLORS[cost] || COST_COLORS[1];
        const idx = (y * width + x) * 4;

        data[idx] = color[0];     // R
        data[idx + 1] = color[1]; // G
        data[idx + 2] = color[2]; // B
        data[idx + 3] = color[3]; // A
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const dataUrl = canvas.toDataURL();
  const extent = [
    rasterBounds.west,
    rasterBounds.south,
    rasterBounds.east,
    rasterBounds.north,
  ];

  return new ImageLayer({
    source: new Static({
      url: dataUrl,
      projection: MARS_PROJECTION,
      imageExtent: extent,
    }),
    opacity: 0.65,
    zIndex: 15,
  });
}
