<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estado extends Model
{
    protected $table = 'estados';

    protected $primaryKey = 'idestado';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'idtipoentidad',
    ];

    protected $casts = [
        'idtipoentidad' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tipoEntidad(): BelongsTo
    {
        return $this->belongsTo(TipoEntidad::class, 'idtipoentidad', 'idtipoentidad');
    }

    public function noticias(): HasMany
    {
        return $this->hasMany(Noticia::class, 'idestado', 'idestado');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'idestado', 'idestado');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'idestado', 'idestado');
    }

    public function tutoriales(): HasMany
    {
        return $this->hasMany(Tutorial::class, 'idestado', 'idestado');
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class, 'idestado', 'idestado');
    }

    public function solicitudesSoporte(): HasMany
    {
        return $this->hasMany(SolicitudSoporte::class, 'idestado', 'idestado');
    }


    public function proyectos(): HasMany
    {
        return $this->hasMany(Proyecto::class, 'idestado', 'idestado');
    }

    public function eventosInscripciones(): HasMany
    {
        return $this->hasMany(EventoInscripcion::class, 'idestado', 'idestado');
    }

}
