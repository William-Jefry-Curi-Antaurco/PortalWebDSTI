<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Noticia extends Model
{
    protected $table = 'noticias';

    protected $primaryKey = 'idnoticia';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'titulo',
        'slug',
        'resumen',
        'contenido',
        'es_destacada',
        'visitas',
        'idcategoria',
        'idusuario_autor',
        'idestado',
        'idtipopublicacion',
        'fecha_publicacion',
        'fecha_expiracion',
    ];

    protected $casts = [
        'idcategoria' => 'integer',
        'idusuario_autor' => 'integer',
        'idestado' => 'integer',
        'idtipopublicacion' => 'integer',
        'es_destacada' => 'boolean',
        'visitas' => 'integer',
        'fecha_publicacion' => 'datetime',
        'fecha_expiracion' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario_autor', 'idusuario');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }

    public function tipoPublicacion(): BelongsTo
    {
        return $this->belongsTo(TipoPublicacion::class, 'idtipopublicacion', 'idtipopublicacion');
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(NoticiaImagen::class, 'idnoticia', 'idnoticia');
    }
}
