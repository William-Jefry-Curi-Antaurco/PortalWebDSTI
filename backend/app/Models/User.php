<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nombre_completo',
    'email',
    'email_verified_at',
    'password_hash',
    'remember_token',
    'idrol',
    'activo',
    'ultimo_acceso',
])]
#[Hidden([
    'password_hash',
    'remember_token',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $primaryKey = 'idusuario';

    public $incrementing = true;

    protected $keyType = 'int';

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function getRememberTokenName(): string
    {
        return 'remember_token';
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'ultimo_acceso' => 'datetime',
            'activo' => 'boolean',
            'password_hash' => 'hashed',
        ];
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'idrol', 'idrol');
    }

    public function estaActivo(): bool
    {
        return (bool) $this->activo;
    }

    public function esAdmin(): bool
    {
        return $this->rol?->nombre === 'admin';
    }


    public function documentosSubidos(): HasMany
    {
        return $this->hasMany(Documento::class, 'idusuario_subidor', 'idusuario');
    }

    public function eventosOrganizados(): HasMany
    {
        return $this->hasMany(Evento::class, 'idusuario_organizador', 'idusuario');
    }

    public function tutorialesAutor(): HasMany
    {
        return $this->hasMany(Tutorial::class, 'idusuario_autor', 'idusuario');
    }

    public function faqsAutor(): HasMany
    {
        return $this->hasMany(Faq::class, 'idusuario_autor', 'idusuario');
    }

    public function solicitudesAtendidas(): HasMany
    {
        return $this->hasMany(SolicitudSoporte::class, 'idusuario_atendio', 'idusuario');
    }

    public function infoInstitucionalEditada(): HasMany
    {
        return $this->hasMany(InfoInstitucional::class, 'idusuario_editor', 'idusuario');
    }

    public function respuestasSoporte(): HasMany
    {
        return $this->hasMany(SolicitudRespuesta::class, 'idusuario', 'idusuario');
    }

    public function logsActividad(): HasMany
    {
        return $this->hasMany(LogActividad::class, 'idusuario', 'idusuario');
    }

    public function noticiasAutor(): HasMany
    {
        return $this->hasMany(Noticia::class, 'idusuario_autor', 'idusuario');
    }

}
