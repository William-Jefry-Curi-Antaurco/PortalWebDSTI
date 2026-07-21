<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EtiquetaContenidoService
{
    /**
     * Sincroniza las etiquetas de un contenido.
     *
     * Ejemplo:
     * entidad: noticias
     * identidad: 1
     * etiquetas: [1, 3, 5]
     */
    public function sincronizar(
        string $entidad,
        int $identidad,
        array $etiquetas = []
    ): void {
        DB::transaction(function () use ($entidad, $identidad, $etiquetas) {
            DB::table('etiquetas_contenido')
                ->where('entidad', $entidad)
                ->where('identidad', $identidad)
                ->delete();

            $idsEtiquetas = collect($etiquetas)
                ->filter(fn ($id) => is_numeric($id))
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();

            if ($idsEtiquetas->isEmpty()) {
                return;
            }

            $etiquetasValidas = DB::table('etiquetas')
                ->whereIn('idetiqueta', $idsEtiquetas)
                ->where('activo', 1)
                ->pluck('idetiqueta');

            if ($etiquetasValidas->isEmpty()) {
                return;
            }

            $registros = $etiquetasValidas
                ->map(fn ($idetiqueta) => [
                    'idetiqueta' => $idetiqueta,
                    'entidad' => $entidad,
                    'identidad' => $identidad,
                    'created_at' => now(),
                ])
                ->all();

            DB::table('etiquetas_contenido')
                ->insert($registros);
        });
    }

    /**
     * Obtiene las etiquetas de un contenido específico.
     */
    public function obtener(
        string $entidad,
        int $identidad
    ): Collection {
        return DB::table('etiquetas as e')
            ->join(
                'etiquetas_contenido as ec',
                'ec.idetiqueta',
                '=',
                'e.idetiqueta'
            )
            ->where('ec.entidad', $entidad)
            ->where('ec.identidad', $identidad)
            ->where('e.activo', 1)
            ->select(
                'e.idetiqueta',
                'e.nombre',
                'e.slug',
                'e.color',
                'e.activo'
            )
            ->orderBy('e.nombre')
            ->get();
    }

    /**
     * Obtiene etiquetas agrupadas para varios registros.
     *
     * Sirve para evitar hacer una consulta por cada noticia/documento/evento.
     */
    public function obtenerPorLote(
        string $entidad,
        array $identidades
    ): Collection {
        $ids = collect($identidades)
            ->filter(fn ($id) => is_numeric($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        return DB::table('etiquetas_contenido as ec')
            ->join(
                'etiquetas as e',
                'e.idetiqueta',
                '=',
                'ec.idetiqueta'
            )
            ->where('ec.entidad', $entidad)
            ->whereIn('ec.identidad', $ids)
            ->where('e.activo', 1)
            ->select(
                'ec.identidad',
                'e.idetiqueta',
                'e.nombre',
                'e.slug',
                'e.color',
                'e.activo'
            )
            ->orderBy('e.nombre')
            ->get()
            ->groupBy('identidad');
    }

    /**
     * Elimina todas las relaciones de etiquetas de un contenido.
     * Se usa cuando eliminas una noticia, documento, evento, etc.
     */
    public function eliminarRelaciones(
        string $entidad,
        int $identidad
    ): void {
        DB::table('etiquetas_contenido')
            ->where('entidad', $entidad)
            ->where('identidad', $identidad)
            ->delete();
    }

    /**
     * Verifica si una etiqueta está siendo usada.
     * Se usa antes de eliminar una etiqueta.
     */
    public function etiquetaTieneContenidos(int $idetiqueta): bool
    {
        return DB::table('etiquetas_contenido')
            ->where('idetiqueta', $idetiqueta)
            ->exists();
    }

    /**
     * Cuenta cuántos contenidos tiene una etiqueta.
     */
    public function contarContenidosEtiqueta(int $idetiqueta): int
    {
        return DB::table('etiquetas_contenido')
            ->where('idetiqueta', $idetiqueta)
            ->count();
    }
}
