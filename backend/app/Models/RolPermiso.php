<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolPermiso extends Model
{
    protected $table = 'roles_permisos';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected $fillable = [
        'idrol',
        'idpermiso',
    ];

    protected $casts = [
        'idrol' => 'integer',
        'idpermiso' => 'integer',
    ];

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'idrol', 'idrol');
    }

    public function permiso(): BelongsTo
    {
        return $this->belongsTo(Permiso::class, 'idpermiso', 'idpermiso');
    }
}
