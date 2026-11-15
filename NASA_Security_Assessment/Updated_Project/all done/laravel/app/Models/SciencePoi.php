<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SciencePoi extends Model
{
    protected $fillable = ['poi_code', 'name', 'description', 'lat', 'lon', 'type', 'metadata'];

    protected $casts = ['metadata' => 'array', 'lat' => 'float', 'lon' => 'float'];
}
