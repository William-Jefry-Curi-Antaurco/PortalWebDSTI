<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Autoridad extends Model
{
    protected $table = 'autoridades';

    protected $primaryKey = 'idautoridad';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre_completo',
        'cargo',
        'funciones_principales',
        'correo_institucional',
        'foto_url',
        'cv_url',
        'orden',
        'fecha_inicio_gestion',
        'fecha_fin_gestion',
        'activo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
        'fecha_inicio_gestion' => 'date',
        'fecha_fin_gestion' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
