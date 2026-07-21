<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoPublicacion extends Model
{
    protected $table = 'tipos_publicacion';

    protected $primaryKey = 'idtipopublicacion';

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

    public function noticias(): HasMany
    {
        return $this->hasMany(Noticia::class, 'idtipopublicacion', 'idtipopublicacion');
    }
}
