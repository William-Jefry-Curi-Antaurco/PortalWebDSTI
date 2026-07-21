<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudRespuesta extends Model
{
    protected $table = 'solicitudes_respuestas';

    protected $primaryKey = 'idsolicitud_respuesta';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'mensaje',
        'es_interno',
        'idsolicitud',
        'idusuario',
    ];

    protected $casts = [
        'es_interno' => 'boolean',
        'idsolicitud' => 'integer',
        'idusuario' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudSoporte::class, 'idsolicitud', 'idsolicitud');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario', 'idusuario');
    }
}
