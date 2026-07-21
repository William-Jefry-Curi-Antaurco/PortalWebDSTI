<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoInscripcion extends Model
{
    protected $table = 'eventos_inscripciones';

    protected $primaryKey = 'idevento_inscripcion';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombres',
        'email',
        'telefono',
        'dependencia',
        'idusuario',
        'idestado',
        'idevento',
    ];

    protected $casts = [
        'idusuario' => 'integer',
        'idestado' => 'integer',
        'idevento' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class, 'idevento', 'idevento');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idusuario', 'idusuario');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'idestado', 'idestado');
    }
}
