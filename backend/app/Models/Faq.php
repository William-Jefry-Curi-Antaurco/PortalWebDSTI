<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Faq extends Model
{
    protected $table = 'faqs';

    protected $primaryKey = 'idfaq';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'pregunta',
        'respuesta',
        'orden',
        'veces_util',
        'idcategoria',
        'idusuario_autor',
        'idestado',
    ];

    protected $casts = [
        'orden' => 'integer',
        'veces_util' => 'integer',
        'idcategoria' => 'integer',
        'idusuario_autor' => 'integer',
        'idestado' => 'integer',
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
}
