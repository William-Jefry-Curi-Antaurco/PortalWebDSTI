<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoOperativo extends Model
{
    protected $table = 'estados_operativos';

    protected $primaryKey = 'idestadooperativo';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function enlacesSistemas(): HasMany
    {
        return $this->hasMany(EnlaceSistema::class, 'idestadooperativo', 'idestadooperativo');
    }

}
