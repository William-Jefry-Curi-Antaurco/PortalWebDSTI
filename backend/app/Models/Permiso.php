<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permiso extends Model
{
    protected $table = 'permisos';

    protected $primaryKey = 'idpermiso';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'idmodulo',
    ];

    protected $casts = [
        'idpermiso' => 'integer',
        'idmodulo' => 'integer',
    ];

    public function modulo(): BelongsTo
    {
        return $this->belongsTo(Modulo::class, 'idmodulo', 'idmodulo');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Rol::class,
            'roles_permisos',
            'idpermiso',
            'idrol',
            'idpermiso',
            'idrol'
        );
    }
}
