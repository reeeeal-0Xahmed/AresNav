<?php

$trek = 'https://trek.nasa.gov/tiles/mars/EQ';

return [
    'binary' => env('MARS_PATHFINDER_BINARY', base_path('bin/rover_pathfinder')),
    'timeout_seconds' => (int) env('MARS_PATHFINDER_TIMEOUT', 120),
    'temporary_directory' => storage_path('app/private/mars/tmp'),

    'maps' => [
        'jezero-regional-200m' => [
            'title' => 'Jezero — Trek الإقليمي 200 م',
            'terrain_file' => storage_path('app/private/mars/jezero-regional-200m/terrain.json'),
            'elevations_file' => storage_path('app/private/mars/jezero-regional-200m/elevations.json'),
            // Same box as requested_bounds inside terrain.json; used to filter POIs without parsing the terrain.
            'bounds' => [
                'west' => 76.80291421306124, 'south' => 17.96348644765699,
                'east' => 78.05672888693876, 'north' => 18.96873545234301,
            ],
        ],
    ],

    // All values are planning assumptions, not NASA operational limits.
    'briefing' => [
        'walk_speed_kmh' => (float) env('MARS_WALK_SPEED_KMH', 2.0),
        'eva_budget_hours' => (float) env('MARS_EVA_BUDGET_HOURS', 8.0),
        'poi_radius_m' => 2000,
        'slope_caution_deg' => 10,
        'slope_nogo_deg' => 20,
        'high_cost_share_caution' => 0.25,
    ],

    // Tile URLs below were NOT verified when this file was written: run `php artisan mars:check-layers`.
    'layers' => [
        'base_viking' => ['title' => 'Viking MDIM 2.1 mosaic (232 m)', 'kind' => 'base',
            'url' => $trek.'/Mars_Viking_MDIM21_InvCyl_mosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg'],
        'hirise_jezero' => ['title' => 'MRO HiRISE Jezero mosaic', 'kind' => 'overlay',
            'url' => $trek.'/MRO_HiRISE_Jezero_Mosaic_Controlled/1.0.0/default/default028mm/{z}/{y}/{x}.png'],
        'geology' => ['title' => 'USGS geologic map (100 m)', 'kind' => 'overlay',
            'url' => $trek.'/Mars_USGS_Geologic_Map_Global_100m/1.0.0/default/default028mm/{z}/{y}/{x}.png'],
        'mola_color' => ['title' => 'MGS MOLA colour shaded relief (463 m)', 'kind' => 'elevation',
            'url' => $trek.'/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg'],
        // Layer name is the one listed in the challenge's data resources; file extension is a guess.
        'ctx_5m' => ['title' => 'MRO CTX global mosaic (5 m)', 'kind' => 'base',
            'url' => $trek.'/CTX_beta01_uncontrolled_5m_Caltech/1.0.0/default/default028mm/{z}/{y}/{x}.png'],
    ],
];
