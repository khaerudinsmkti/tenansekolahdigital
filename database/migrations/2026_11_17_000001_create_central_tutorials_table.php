<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tutorials')) {
            Schema::create('tutorials', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('youtube_url', 500);
                $table->string('youtube_id', 50);
                $table->text('description')->nullable();
                $table->json('target_roles');
                $table->integer('order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['is_active', 'order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tutorials');
    }
};
