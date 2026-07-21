<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogActividad extends Model
{
    protected $table = 'logs_actividad';

    protected $primaryKey = 'idlog';

    public $incrementing = true;

    protected $keyType = 'int';

    const UPDATED_AT = null;

    protected $fillable = [
        'idusuario',
        'accion',
        'entidad',
        'identificador_entidad',
        'ip_origen',
        'user_agent',
        'detalles',
    ];

    protected $casts = [
        'idusuario' => 'integer',
        'identificador_entidad' => 'integer',
        'detalles' => 'array',
        'created_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario', 'idusuario');
    }
}
