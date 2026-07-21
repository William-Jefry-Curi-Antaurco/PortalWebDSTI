<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoEntidad extends Model
{
    protected $table = 'tipos_entidad';

    protected $primaryKey = 'idtipoentidad';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'slug',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function estados(): HasMany
    {
        return $this->hasMany(Estado::class, 'idtipoentidad', 'idtipoentidad');
    }
}
