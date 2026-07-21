<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnlaceSistema extends Model
{
    protected $table = 'enlaces_sistemas';

    protected $primaryKey = 'idenlace';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre_sistema',
        'slug',
        'descripcion',
        'url',
        'icono',
        'idcategoria',
        'idestadooperativo',
        'idarchivo_manual',
        'idarchivo_documentacion',
        'orden',
        'activo',
    ];

    protected $casts = [
        'idcategoria' => 'integer',
        'idestadooperativo' => 'integer',
        'idarchivo_manual' => 'integer',
        'idarchivo_documentacion' => 'integer',
        'orden' => 'integer',
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function estadoOperativo(): BelongsTo
    {
        return $this->belongsTo(EstadoOperativo::class, 'idestadooperativo', 'idestadooperativo');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }

    public function archivoManual(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo_manual', 'idarchivo');
    }

    public function archivoDocumentacion(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo_documentacion', 'idarchivo');
    }
}
