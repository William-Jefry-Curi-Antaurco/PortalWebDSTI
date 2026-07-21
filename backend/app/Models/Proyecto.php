<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proyecto extends Model
{
    protected $table = 'proyectos';

    protected $primaryKey = 'idproyecto';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'titulo',
        'slug',
        'descripcion',
        'porcentaje_avance',
        'fecha_inicio',
        'fecha_fin',
        'responsable',
        'url_resultado',
        'idcategoria',
        'idestado',
        'idarchivo',
        'orden',
        'activo',
    ];

    protected $casts = [
        'porcentaje_avance' => 'integer',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'idcategoria' => 'integer',
        'idestado' => 'integer',
        'idarchivo' => 'integer',
        'orden' => 'integer',
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }

    public function archivo(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo', 'idarchivo');
    }
}
