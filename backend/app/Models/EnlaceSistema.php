<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnlaceSistema extends Model
{
    protected $table = 'enlaces_sistemas';

    protected $primaryKey = 'idenlace';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre_sistema',
        'slug',
        'descripcion',
        'url',
        'icono',
        'idcategoria',
        'idestadooperativo',
        'orden',
        'activo',
    ];

    protected $casts = [
        'idcategoria' => 'integer',
        'idestadooperativo' => 'integer',
        'orden' => 'integer',
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function estadoOperativo(): BelongsTo
    {
        return $this->belongsTo(EstadoOperativo::class, 'idestadooperativo', 'idestadooperativo');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }
}
