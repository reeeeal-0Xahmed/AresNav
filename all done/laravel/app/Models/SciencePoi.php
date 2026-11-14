<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SciencePoi extends Model
{
    // The API returns poi_code AS id; without this Eloquent casts that alias to int (always 0).
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['poi_code', 'name', 'description', 'lat', 'lon', 'type', 'metadata'];

    protected $casts = ['metadata' => 'array', 'lat' => 'float', 'lon' => 'float'];
}
