<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortalConfiguracion extends Model
{
    protected $table = 'portal_configuracion';

    protected $primaryKey = 'idconfig';

    public $incrementing = true;

    protected $keyType = 'int';

    /**
     * La tabla no usa timestamps de Laravel.
     * updated_at lo gestiona MySQL con ON UPDATE CURRENT_TIMESTAMP.
     */
    public $timestamps = false;

    protected $fillable = [
        'clave',
        'valor',
        'idarchivo',
        'tipo',
        'grupo',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    /**
     * Devuelve el valor de una clave activa.
     */
    public static function get(string $clave, mixed $default = null): mixed
    {
        $row = static::query()
            ->where('clave', $clave)
            ->where('activo', 1)
            ->first();

        return $row ? $row->valor : $default;
    }

    /**
     * Devuelve todas las claves activas de un grupo.
     */
    public static function grupo(string $grupo): array
    {
        return static::query()
            ->where('grupo', $grupo)
            ->where('activo', 1)
            ->orderBy('idconfig')
            ->pluck('valor', 'clave')
            ->toArray();
    }

    /**
     * Devuelve todas las claves activas agrupadas por grupo.
     */
    public static function todos(): array
    {
        return static::query()
            ->where('activo', 1)
            ->orderBy('grupo')
            ->orderBy('idconfig')
            ->get()
            ->groupBy('grupo')
            ->map(fn ($items) => $items->pluck('valor', 'clave'))
            ->toArray();
    }

    /**
     * Devuelve configuración pública.
     *
     * Importante:
     * - NO se expone el grupo smtp.
     * - SÍ se expone avanzado, porque el portal necesita:
     *   modo_mantenimiento, SEO, textos de mantenimiento,
     *   lazy_load_secciones y cantidades del inicio.
     * - Se excluyen claves sensibles puntuales.
     */
    public static function publicos(): array
    {
        $clavesExcluidas = [
            // SMTP
            'smtp_host',
            'smtp_puerto',
            'smtp_usuario',
            'smtp_password',
            'smtp_encriptacion',

            // Correos internos de soporte
            'soporte_correo_destino',
            'soporte_correo_noreply',
        ];

        return static::query()
            ->where('activo', 1)
            ->whereNotIn('grupo', ['smtp'])
            ->whereNotIn('clave', $clavesExcluidas)
            ->orderBy('grupo')
            ->orderBy('idconfig')
            ->get()
            ->groupBy('grupo')
            ->map(fn ($items) => $items->pluck('valor', 'clave'))
            ->toArray();
    }

    /**
     * Actualiza masivamente clave => valor.
     * Solo actualiza claves existentes.
     */
    public static function upsertValores(array $pares): void
    {
        foreach ($pares as $clave => $valor) {
            static::query()
                ->where('clave', $clave)
                ->update([
                    'valor' => $valor,
                ]);
        }
    }

    /**
     * Helper para leer booleanos tipo 1/0.
     */
    public static function booleano(string $clave, bool $default = false): bool
    {
        $valor = static::get($clave);

        if ($valor === null) {
            return $default;
        }

        return in_array(
            strtolower((string) $valor),
            ['1', 'true', 'si', 'sí', 'on'],
            true
        );
    }

    /**
     * Helper para leer enteros.
     */
    public static function entero(string $clave, int $default = 0): int
    {
        $valor = static::get($clave);

        return is_numeric($valor) ? (int) $valor : $default;
    }


    public function archivo(): BelongsTo
    {
        return $this->belongsTo(
            Archivo::class,
            'idarchivo',
            'idarchivo'
        );
    }
}
