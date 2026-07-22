<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\PortalConfiguracion;
use App\Services\ArchivoLimpiezaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class ConfiguracionController extends Controller
{
    /**
     * GET /api/admin/configuracion
     */
    public function index(Request $request): JsonResponse
    {
        $query = PortalConfiguracion::query()
            ->with('archivo')
            ->orderBy('grupo')
            ->orderBy('clave');

        if ($request->filled('grupo')) {
            $query->where('grupo', $request->query('grupo'));
        }

        $registros = $query->get();

        $data = $registros
            ->groupBy('grupo')
            ->map(function ($configuraciones) {
                return $configuraciones->mapWithKeys(function ($configuracion) {
                    return [
                        $configuracion->clave => $this->transformarConfiguracion(
                            $configuracion
                        ),
                    ];
                });
            });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * PUT /api/admin/configuracion
     *
     * Actualiza configuraciones que no son archivos.
     */
    public function update(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'config'   => ['required', 'array'],
            'config.*' => ['nullable', 'string', 'max:5000'],
        ], [
            'config.required' => 'Debes enviar al menos una clave de configuración.',
            'config.array'    => 'El formato de configuración no es válido.',
            'config.*.string' => 'Los valores de configuración deben ser texto.',
            'config.*.max'    => 'Uno de los valores supera el límite permitido.',
        ]);

        /*
         * No permitir actualizar configuraciones tipo archivo
         * desde este endpoint.
         */
        $configuracionesPermitidas = PortalConfiguracion::query()
            ->where('tipo', '!=', 'archivo')
            ->pluck('clave')
            ->toArray();

        $aActualizar = array_filter(
            $payload['config'],
            fn ($clave) => in_array(
                $clave,
                $configuracionesPermitidas,
                true
            ),
            ARRAY_FILTER_USE_KEY
        );

        if (empty($aActualizar)) {
            return response()->json([
                'message' => 'No se encontraron claves válidas para actualizar.',
            ], 422);
        }

        PortalConfiguracion::upsertValores($aActualizar);

        return response()->json([
            'message' => 'Configuración guardada correctamente.',
            'data'    => $this->obtenerConfiguracionAgrupada(),
        ]);
    }

    /**
     * POST /api/admin/configuracion/archivo
     *
     * multipart/form-data:
     * clave   = img_logo
     * archivo = archivo seleccionado
     */
    public function updateArchivo(Request $request, ArchivoLimpiezaService $archivoLimpieza): JsonResponse
    {
        $payload = $request->validate([
            'clave' => [
                'required',
                'string',
                Rule::exists('portal_configuracion', 'clave')
                    ->where(fn ($query) => $query
                        ->where('tipo', 'archivo')
                        ->where('activo', 1)),
            ],

            'archivo' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,svg',
                'max:5120',
            ],
        ], [
            'clave.required'   => 'La clave de configuración es obligatoria.',
            'clave.exists'     => 'La clave no existe o no corresponde a un archivo.',
            'archivo.required' => 'Debes seleccionar una imagen.',
            'archivo.file'     => 'El archivo enviado no es válido.',
            'archivo.mimes'    => 'Solo se permiten imágenes JPG, PNG, WEBP o SVG.',
            'archivo.max'      => 'La imagen no debe superar los 5 MB.',
        ]);

        $rutaGuardada = null;
        $archivoAnterior = null;

        try {
            $resultado = DB::transaction(function () use ($payload, &$rutaGuardada, &$archivoAnterior) {
                $configuracion = PortalConfiguracion::query()
                    ->with('archivo')
                    ->where('clave', $payload['clave'])
                    ->where('tipo', 'archivo')
                    ->lockForUpdate()
                    ->firstOrFail();

                /** @var UploadedFile $archivoSubido */
                $archivoSubido = $payload['archivo'];

                $archivoAnterior = $configuracion->archivo;

                $nombreGuardado = $this->generarNombreGuardado(
                    $configuracion->clave,
                    $archivoSubido
                );

                $rutaGuardada = $archivoSubido->storeAs(
                    'configuracion',
                    $nombreGuardado,
                    'public'
                );

                if (!$rutaGuardada) {
                    throw new \RuntimeException(
                        'No se pudo almacenar el archivo.'
                    );
                }

                $nuevoArchivo = Archivo::query()->create([
                    'nombre_original' => $archivoSubido->getClientOriginalName(),
                    'nombre_guardado' => $nombreGuardado,
                    'ruta'            => $rutaGuardada,
                    'extension'       => strtolower(
                        $archivoSubido->getClientOriginalExtension()
                    ),
                    'mime_type'       => $archivoSubido->getMimeType()
                        ?: 'application/octet-stream',
                    'peso_bytes'      => $archivoSubido->getSize(),
                    'descargas'       => 0,
                ]);

                $configuracion->update([
                    'idarchivo' => $nuevoArchivo->idarchivo,
                    'valor'     => null,
                ]);

                return $configuracion
                    ->fresh('archivo');
            });
        } catch (Throwable $exception) {
            if ($rutaGuardada) {
                Storage::disk('public')->delete($rutaGuardada);
            }

            report($exception);

            return response()->json([
                'message' => 'No se pudo guardar la imagen de configuración.',
            ], 500);
        }

        /*
         * Eliminar el archivo anterior solamente si ya no está siendo
         * usado por otra configuración o por otro módulo.
         */
        $archivoLimpieza->eliminarSiNoEstaEnUso($archivoAnterior);

        return response()->json([
            'message' => 'Imagen de configuración actualizada correctamente.',
            'data'    => [
                $resultado->clave => $this->transformarConfiguracion(
                    $resultado
                ),
            ],
        ]);
    }

    /**
     * DELETE /api/admin/configuracion/archivo/{clave}
     *
     * Quita la imagen administrable y deja activo el fallback del frontend.
     */
    public function eliminarArchivo(string $clave, ArchivoLimpiezaService $archivoLimpieza): JsonResponse
    {
        $configuracion = PortalConfiguracion::query()
            ->with('archivo')
            ->where('clave', $clave)
            ->where('tipo', 'archivo')
            ->firstOrFail();

        $archivo = $configuracion->archivo;

        $configuracion->update([
            'idarchivo' => null,
            'valor'     => null,
        ]);

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivo);

        return response()->json([
            'message' => 'Imagen eliminada correctamente.',
            'data'    => [
                $clave => [
                    'clave'     => $clave,
                    'tipo'      => 'archivo',
                    'valor'     => null,
                    'idarchivo' => null,
                    'url'       => null,
                ],
            ],
        ]);
    }

    /**
     * GET /api/public/configuracion
     */
    public function publico(): JsonResponse
    {
        $gruposPrivados = [
            'smtp',
        ];

        $registros = PortalConfiguracion::query()
            ->with('archivo')
            ->where('activo', 1)
            ->whereNotIn('grupo', $gruposPrivados)
            ->orderBy('grupo')
            ->orderBy('clave')
            ->get();

        /*
         * Para el portal público conviene devolver directamente:
         * clave => valor resuelto
         */
        $data = $registros
            ->groupBy('grupo')
            ->map(function ($configuraciones) {
                return $configuraciones->mapWithKeys(function ($configuracion) {
                    return [
                        $configuracion->clave =>
                            $this->resolverValor($configuracion),
                    ];
                });
            });

        return response()->json([
            'data' => $data,
        ]);
    }

    private function obtenerConfiguracionAgrupada()
    {
        return PortalConfiguracion::query()
            ->with('archivo')
            ->orderBy('grupo')
            ->orderBy('clave')
            ->get()
            ->groupBy('grupo')
            ->map(function ($configuraciones) {
                return $configuraciones->mapWithKeys(function ($configuracion) {
                    return [
                        $configuracion->clave => $this->transformarConfiguracion(
                            $configuracion
                        ),
                    ];
                });
            });
    }

    private function transformarConfiguracion(
        PortalConfiguracion $configuracion
    ): array {
        return [
            'idconfig'   => $configuracion->idconfig,
            'clave'      => $configuracion->clave,
            'tipo'       => $configuracion->tipo,
            'grupo'      => $configuracion->grupo,
            'valor'      => $configuracion->valor,
            'idarchivo'  => $configuracion->idarchivo,
            'url'        => $configuracion->archivo
                ? Storage::disk('public')->url(
                    $configuracion->archivo->ruta
                )
                : null,
            'archivo'    => $configuracion->archivo
                ? [
                    'idarchivo'      => $configuracion->archivo->idarchivo,
                    'nombre_original'=> $configuracion->archivo->nombre_original,
                    'extension'      => $configuracion->archivo->extension,
                    'mime_type'      => $configuracion->archivo->mime_type,
                    'peso_bytes'     => $configuracion->archivo->peso_bytes,
                ]
                : null,
            'descripcion' => $configuracion->descripcion,
            'activo'      => (bool) $configuracion->activo,
        ];
    }

    private function resolverValor(
        PortalConfiguracion $configuracion
    ): mixed {
        if (
            $configuracion->tipo === 'archivo' &&
            $configuracion->archivo
        ) {
            return Storage::disk('public')->url(
                $configuracion->archivo->ruta
            );
        }

        return match ($configuracion->tipo) {
            'booleano' => filter_var(
                $configuracion->valor,
                FILTER_VALIDATE_BOOLEAN
            ),

            'numero' => is_numeric($configuracion->valor)
                ? $configuracion->valor + 0
                : null,

            'json' => json_decode(
                $configuracion->valor ?? 'null',
                true
            ),

            default => $configuracion->valor,
        };
    }

    private function generarNombreGuardado(
        string $clave,
        UploadedFile $archivo
    ): string {
        $extension = strtolower(
            $archivo->getClientOriginalExtension()
        );

        return Str::slug($clave)
            . '-'
            . now()->format('YmdHis')
            . '-'
            . Str::lower(Str::random(8))
            . '.'
            . $extension;
    }
}
