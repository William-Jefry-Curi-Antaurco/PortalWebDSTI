<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'roles';

    protected $primaryKey = 'idrol';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    protected $casts = [
        'idrol' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'idrol', 'idrol');
    }

    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(
            Permiso::class,
            'roles_permisos',
            'idrol',
            'idpermiso',
            'idrol',
            'idpermiso'
        );
    }
}
