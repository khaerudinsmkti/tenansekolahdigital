<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CentralTutorial extends Model
{
    protected $table = 'tutorials';

    protected $fillable = [
        'title',
        'youtube_url',
        'youtube_id',
        'description',
        'target_roles',
        'order',
        'is_active',
    ];

    protected $casts = [
        'target_roles' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    protected $appends = [
        'thumbnail_url',
        'embed_url',
    ];

    public function getConnectionName(): ?string
    {
        return (string) config('tenancy.database.central_connection', config('database.default'));
    }

    public function getThumbnailUrlAttribute(): string
    {
        return "https://img.youtube.com/vi/{$this->youtube_id}/hqdefault.jpg";
    }

    public function getEmbedUrlAttribute(): string
    {
        return "https://www.youtube.com/embed/{$this->youtube_id}?rel=0";
    }
}
