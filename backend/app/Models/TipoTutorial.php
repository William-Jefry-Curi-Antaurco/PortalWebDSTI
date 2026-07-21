<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoTutorial extends Model
{
    protected $table = 'tipos_tutorial';

    protected $primaryKey = 'idtipotutorial';

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

    public function tutoriales(): HasMany
    {
        return $this->hasMany(Tutorial::class, 'idtipotutorial', 'idtipotutorial');
    }
}
