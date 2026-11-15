<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mars_route_requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->char('session_hash', 64)->index();
            $table->string('map_id', 50);
            $table->char('map_version', 64);
            $table->unsignedInteger('start_x');
            $table->unsignedInteger('start_y');
            $table->unsignedInteger('target_x');
            $table->unsignedInteger('target_y');
            $table->string('status', 20)->index();
            $table->json('result')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mars_route_requests');
    }
};
