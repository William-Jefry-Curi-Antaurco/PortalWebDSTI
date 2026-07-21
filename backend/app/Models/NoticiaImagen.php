<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoticiaImagen extends Model
{
    protected $table = 'noticias_imagen';

    protected $primaryKey = 'idnoticiaimagen';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'texto_alternativo',
        'descripcion',
        'es_portada',
        'orden',
        'idarchivo',
        'idnoticia',
    ];

    protected $casts = [
        'idarchivo' => 'integer',
        'idnoticia' => 'integer',
        'es_portada' => 'boolean',
        'orden' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function noticia(): BelongsTo
    {
        return $this->belongsTo(Noticia::class, 'idnoticia', 'idnoticia');
    }

    public function archivo(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo', 'idarchivo');
    }
}
