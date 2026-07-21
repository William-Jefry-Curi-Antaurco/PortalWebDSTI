<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InfoInstitucional extends Model
{
    protected $table = 'info_institucional';

    protected $primaryKey = 'idinfo';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'clave',
        'titulo',
        'contenido',
        'orden',
        'activo',
        'idusuario_editor',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
        'idusuario_editor' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario_editor', 'idusuario');
    }
}
