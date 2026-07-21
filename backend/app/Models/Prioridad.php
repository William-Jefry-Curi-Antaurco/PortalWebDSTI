<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prioridad extends Model
{
    protected $table = 'prioridades';

    protected $primaryKey = 'idprioridad';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'nivel',
        'dias_respuesta_max',
        'descripcion',
    ];

    protected $casts = [
        'nivel' => 'integer',
        'dias_respuesta_max' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function solicitudesSoporte(): HasMany
    {
        return $this->hasMany(SolicitudSoporte::class, 'idprioridad', 'idprioridad');
    }
}
