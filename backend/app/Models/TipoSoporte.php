<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoSoporte extends Model
{
    protected $table = 'tipos_soporte';

    protected $primaryKey = 'idtiposoporte';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function solicitudesSoporte(): HasMany
    {
        return $this->hasMany(SolicitudSoporte::class, 'idtiposoporte', 'idtiposoporte');
    }

}
