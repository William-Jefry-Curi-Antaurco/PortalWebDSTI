<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EtiquetaContenido extends Model
{
    protected $table = 'etiquetas_contenido';

    protected $primaryKey = null;

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'idetiqueta',
        'entidad',
        'identidad',
    ];

    protected $casts = [
        'idetiqueta' => 'integer',
        'identidad' => 'integer',
        'created_at' => 'datetime',
    ];

    public function etiqueta(): BelongsTo
    {
        return $this->belongsTo(Etiqueta::class, 'idetiqueta', 'idetiqueta');
    }
}
