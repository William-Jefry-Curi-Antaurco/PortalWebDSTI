<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SolicitudSoporte extends Model
{
    protected $table = 'solicitudes_soporte';

    protected $primaryKey = 'idsolicitud';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombres',
        'email',
        'telefono',
        'dependencia',
        'asunto',
        'descripcion',
        'idarchivo',
        'ip_origen',
        'consentimiento_privacidad',
        'codigo_ticket',
        'idtiposoporte',
        'idprioridad',
        'idestado',
        'idusuario_atendio',
    ];

    protected $casts = [
        'consentimiento_privacidad' => 'boolean',
        'idarchivo' => 'integer',
        'idtiposoporte' => 'integer',
        'idprioridad' => 'integer',
        'idestado' => 'integer',
        'idusuario_atendio' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function archivo(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo', 'idarchivo');
    }

    public function tipoSoporte(): BelongsTo
    {
        return $this->belongsTo(TipoSoporte::class, 'idtiposoporte', 'idtiposoporte');
    }

    public function prioridad(): BelongsTo
    {
        return $this->belongsTo(Prioridad::class, 'idprioridad', 'idprioridad');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }

    public function usuarioAtendio(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario_atendio', 'idusuario');
    }

    public function respuestas(): HasMany
    {
        return $this->hasMany(SolicitudRespuesta::class, 'idsolicitud', 'idsolicitud');
    }
}
