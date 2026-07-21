<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

trait ClearsPortalPublicCache
{
    /**
     * Limpia toda la caché pública del portal.
     *
     * — Claves fijas: se borran directamente con Cache::forget()
     * — Claves dinámicas (con md5): se borran escaneando el filesystem
     *   o con Cache::flush() si el driver no soporta patrones.
     *
     * Si usas Redis en producción, migra a Cache::tags(['portal-public'])->flush()
     * y añade ->tags(['portal-public']) en cada Cache::remember() del controller.
     */
    protected function clearPortalPublicCache(): void
    {
        // ── Claves fijas ──────────────────────────────────────────────────────
        $fixed = [
            'public:catalogos',
            'public:inicio',
            'public:institucional',
            'public:autoridades',
        ];

        foreach ($fixed as $key) {
            Cache::forget($key);
        }

        // ── Claves de módulos activos ─────────────────────────────────────────
        $slugs = [
            'institucional',
            'noticias-comunicados',
            'servicios-tecnologicos',
            'sistemas-institucionales',
            'documentos-manuales',
            'eventos-capacitaciones',
            'tutoriales-recursos',
            'mesa-ayuda',
            'proyectos-tecnologicos',
        ];

        foreach ($slugs as $slug) {
            Cache::forget("public:modulo:{$slug}");
        }

        // ── Claves dinámicas con md5 ──────────────────────────────────────────
        // Para driver=file: borramos los archivos cuyo nombre empiece con
        // el hash de las claves que conocemos (prefijo public:{grupo}:).
        // La forma más segura y compatible es limpiar todo el store público.
        $driver = config('cache.default');

        if ($driver === 'file') {
            $this->clearFileCacheByPrefix('public:');
        } elseif ($driver === 'redis' || $driver === 'memcached') {
            // En Redis con tags sería: Cache::tags(['portal-public'])->flush()
            // Sin tags, la única opción segura es flush completo del store.
            // Descomenta solo si tienes un store separado para el portal:
            // Cache::store('portal')->flush();
        }
        // Si ningún driver coincide, las claves dinámicas expirarán por TTL.
    }

    /**
     * Borra archivos de caché cuya clave almacenada empiece con $prefix.
     * Solo funciona con CACHE_STORE=file.
     */
    private function clearFileCacheByPrefix(string $prefix): void
    {
        $cachePath = config('cache.stores.file.path', storage_path('framework/cache/data'));

        if (!is_dir($cachePath)) return;

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($cachePath, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (!$file->isFile()) continue;

            try {
                $contents = file_get_contents($file->getPathname());
                if (!$contents) continue;

                // El driver file guarda: timestamp(10) + serialized_data
                // Deserializamos para leer la clave original
                $payload = unserialize(substr($contents, 10));

                if (is_array($payload) && isset($payload['key'])) {
                    if (str_starts_with($payload['key'], $prefix)) {
                        @unlink($file->getPathname());
                    }
                } else {
                    // Formato alternativo: buscar el prefijo en el contenido raw
                    if (str_contains($contents, '"' . $prefix) || str_contains($contents, $prefix)) {
                        @unlink($file->getPathname());
                    }
                }
            } catch (\Throwable) {
                // Si no se puede leer el archivo, ignorar
            }
        }
    }
}
