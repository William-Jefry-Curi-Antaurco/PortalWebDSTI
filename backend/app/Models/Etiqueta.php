<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Etiqueta extends Model
{
    protected $table = 'etiquetas';

    protected $primaryKey = 'idetiqueta';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'color',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contenidos(): HasMany
    {
        return $this->hasMany(EtiquetaContenido::class, 'idetiqueta', 'idetiqueta');
    }
}
