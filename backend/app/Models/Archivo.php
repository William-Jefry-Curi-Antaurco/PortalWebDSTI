<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Archivo extends Model
{
    protected $table = 'archivos';

    protected $primaryKey = 'idarchivo';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre_original',
        'nombre_guardado',
        'ruta',
        'extension',
        'mime_type',
        'peso_bytes',
        'descargas',
    ];

    protected $casts = [
        'peso_bytes' => 'integer',
        'descargas' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];


    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'idarchivo', 'idarchivo');
    }

    public function noticiasImagen(): HasMany
    {
        return $this->hasMany(NoticiaImagen::class, 'idarchivo', 'idarchivo');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'idarchivo', 'idarchivo');
    }

    public function eventosArchivos()
    {
        return $this->hasMany(EventoArchivo::class, 'idarchivo', 'idarchivo');
    }

    public function tutoriales(): HasMany
    {
        return $this->hasMany(Tutorial::class, 'idarchivo', 'idarchivo');
    }

    public function proyectos(): HasMany
    {
        return $this->hasMany(Proyecto::class, 'idarchivo', 'idarchivo');
    }

    public function solicitudesSoporte(): HasMany
    {
        return $this->hasMany(SolicitudSoporte::class, 'idarchivo', 'idarchivo');
    }



}
