<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Modulo extends Model
{
    protected $table = 'modulos';

    protected $primaryKey = 'idmodulo';

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

    public function categorias(): HasMany
    {
        return $this->hasMany(Categoria::class, 'idmodulo', 'idmodulo');
    }

    public function permisos(): HasMany
    {
        return $this->hasMany(Permiso::class, 'idmodulo', 'idmodulo');
    }

}
