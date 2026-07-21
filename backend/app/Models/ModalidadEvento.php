<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModalidadEvento extends Model
{
    protected $table = 'modalidades_evento';

    protected $primaryKey = 'idmodalidad';

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

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'idmodalidad', 'idmodalidad');
    }
}
