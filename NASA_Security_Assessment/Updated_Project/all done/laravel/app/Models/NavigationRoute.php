<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NavigationRoute extends Model
{
    protected $fillable = [
        'grid_hash',
        'width',
        'height',
        'start_point',
        'target_point',
        'calculated_path',
        'execution_time_ms',
    ];

    protected $casts = [
        'start_point' => 'array',
        'target_point' => 'array',
        'calculated_path' => 'array',
    ];
}
