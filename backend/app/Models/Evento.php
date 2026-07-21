<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evento extends Model
{
    protected $table = 'eventos';

    protected $primaryKey = 'idevento';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'titulo',
        'slug',
        'descripcion',
        'fecha_inicio',
        'fecha_fin',
        'ubicacion',
        'enlace_virtual',
        'cupo_maximo',
        'cupos_ocupados',
        'idarchivo',
        'idcategoria',
        'idusuario_organizador',
        'idestado',
        'idtipoevento',
        'idmodalidad',
    ];

    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'cupo_maximo' => 'integer',
        'cupos_ocupados' => 'integer',
        'idarchivo' => 'integer',
        'idcategoria' => 'integer',
        'idusuario_organizador' => 'integer',
        'idestado' => 'integer',
        'idtipoevento' => 'integer',
        'idmodalidad' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function archivos()
    {
        return $this->hasMany(EventoArchivo::class, 'idevento', 'idevento');
    }
    public function archivo(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo', 'idarchivo');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }

    public function organizador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario_organizador', 'idusuario');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }

    public function tipoEvento(): BelongsTo
    {
        return $this->belongsTo(TipoEvento::class, 'idtipoevento', 'idtipoevento');
    }

    public function modalidad(): BelongsTo
    {
        return $this->belongsTo(ModalidadEvento::class, 'idmodalidad', 'idmodalidad');
    }

    public function inscripciones(): HasMany
    {
        return $this->hasMany(EventoInscripcion::class, 'idevento', 'idevento');
    }





}
