<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('science_pois', function (Blueprint $table): void {
            $table->id();
            $table->string('poi_code')->unique();
            $table->string('name');
            $table->text('description');
            $table->decimal('lat', 10, 7);
            $table->decimal('lon', 10, 7);
            $table->string('type')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('science_pois');
    }
};
