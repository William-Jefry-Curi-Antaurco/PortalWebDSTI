<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoArchivo extends Model
{
    protected $table = 'eventos_archivos';

    protected $primaryKey = 'ideventoarchivo';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'es_portada',
        'orden',
        'idarchivo',
        'idevento',
    ];

    protected $casts = [
        'es_portada' => 'boolean',
        'orden' => 'integer',
        'idarchivo' => 'integer',
        'idevento' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class, 'idevento', 'idevento');
    }

    public function archivo(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo', 'idarchivo');
    }
}
