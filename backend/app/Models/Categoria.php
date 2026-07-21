<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $primaryKey = 'idcategoria';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'orden',
        'activo',
        'idmodulo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
        'idmodulo' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function noticias(): HasMany
    {
        return $this->hasMany(Noticia::class, 'idcategoria', 'idcategoria');
    }

    public function modulo(): BelongsTo
    {
        return $this->belongsTo(Modulo::class, 'idmodulo', 'idmodulo');
    }

    public function servicios(): HasMany
    {
        return $this->hasMany(Servicio::class, 'idcategoria', 'idcategoria');
    }


    public function enlacesSistemas(): HasMany
    {
        return $this->hasMany(EnlaceSistema::class, 'idcategoria', 'idcategoria');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'idcategoria', 'idcategoria');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'idcategoria', 'idcategoria');
    }

    public function tutoriales(): HasMany
    {
        return $this->hasMany(Tutorial::class, 'idcategoria', 'idcategoria');
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class, 'idcategoria', 'idcategoria');
    }

    public function proyectos(): HasMany
    {
        return $this->hasMany(Proyecto::class, 'idcategoria', 'idcategoria');
    }

}
