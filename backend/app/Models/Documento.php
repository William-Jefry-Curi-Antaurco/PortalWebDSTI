<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Documento extends Model
{
    protected $table = 'documentos';

    protected $primaryKey = 'iddocumento';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'titulo',
        'slug',
        'descripcion',
        'version',
        'es_version_actual',
        'fecha_documento',
        'iddocumento_padre',
        'idarchivo',
        'idcategoria',
        'idusuario_subidor',
        'idestado',
        'idtipodocumento',
    ];

    protected $casts = [
        'es_version_actual' => 'boolean',
        'fecha_documento' => 'date',
        'iddocumento_padre' => 'integer',
        'idarchivo' => 'integer',
        'idcategoria' => 'integer',
        'idusuario_subidor' => 'integer',
        'idestado' => 'integer',
        'idtipodocumento' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function archivo(): BelongsTo
    {
        return $this->belongsTo(Archivo::class, 'idarchivo', 'idarchivo');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }

    public function usuarioSubidor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario_subidor', 'idusuario');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'idtipodocumento', 'idtipodocumento');
    }

    public function documentoPadre(): BelongsTo
    {
        return $this->belongsTo(Documento::class, 'iddocumento_padre', 'iddocumento');
    }

    public function versiones(): HasMany
    {
        return $this->hasMany(Documento::class, 'iddocumento_padre', 'iddocumento');
    }
}
