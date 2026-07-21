<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tutorial extends Model
{
    protected $table = 'tutoriales';

    protected $primaryKey = 'idtutorial';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'titulo',
        'slug',
        'descripcion',
        'contenido_html',
        'enlace_video',
        'duracion_minutos',
        'visitas',
        'orden',
        'idarchivo',
        'idcategoria',
        'idusuario_autor',
        'idestado',
        'idtipotutorial',
    ];

    protected $casts = [
        'duracion_minutos' => 'integer',
        'visitas' => 'integer',
        'orden' => 'integer',
        'idarchivo' => 'integer',
        'idcategoria' => 'integer',
        'idusuario_autor' => 'integer',
        'idestado' => 'integer',
        'idtipotutorial' => 'integer',
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

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario_autor', 'idusuario');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }

    public function tipoTutorial(): BelongsTo
    {
        return $this->belongsTo(TipoTutorial::class, 'idtipotutorial', 'idtipotutorial');
    }
}
