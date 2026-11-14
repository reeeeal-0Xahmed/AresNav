<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MarsRouteRequest extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];
    protected $hidden = ['session_hash'];
    protected $casts = [
        'start_x' => 'integer', 'start_y' => 'integer',
        'target_x' => 'integer', 'target_y' => 'integer',
        'input_coordinates' => 'array',
        'result' => 'array',
    ];
}
