<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Estado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EstadoController extends Controller
{
    public function index(): JsonResponse
    {
        $estados = Estado::with('tipoEntidad')
            ->withCount([
                'noticias',
                'documentos',
                'eventos',
                'eventosInscripciones',
                'tutoriales',
                'faqs',
                'solicitudesSoporte',
                'proyectos',
            ])
            ->orderBy('idtipoentidad')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de estados obtenido correctamente.',
            'data' => $estados,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $estado = Estado::with('tipoEntidad')
            ->withCount([
                'noticias',
                'documentos',
                'eventos',
                'eventosInscripciones',
                'tutoriales',
                'faqs',
                'solicitudesSoporte',
                'proyectos',
            ])
            ->find($id);

        if (!$estado) {
            return response()->json([
                'success' => false,
                'message' => 'El estado no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Estado obtenido correctamente.',
            'data' => $estado,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'idtipoentidad' => [
                'required',
                'integer',
                'exists:tipos_entidad,idtipoentidad',
            ],
        ]);

        $slugBase = Str::slug($validated['nombre']);
        $slug = $slugBase;
        $contador = 1;

        while (
        Estado::where('idtipoentidad', $validated['idtipoentidad'])
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $estado = Estado::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'idtipoentidad' => $validated['idtipoentidad'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estado registrado correctamente.',
            'data' => $estado->load('tipoEntidad'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $estado = Estado::find($id);

        if (!$estado) {
            return response()->json([
                'success' => false,
                'message' => 'El estado no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'idtipoentidad' => [
                'required',
                'integer',
                'exists:tipos_entidad,idtipoentidad',
            ],
        ]);

        if (
            $estado->nombre !== $validated['nombre'] ||
            $estado->idtipoentidad !== (int) $validated['idtipoentidad']
        ) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            Estado::where('idtipoentidad', $validated['idtipoentidad'])
                ->where('slug', $slug)
                ->where('idestado', '!=', $estado->idestado)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $estado->slug = $slug;
        }

        $estado->nombre = $validated['nombre'];
        $estado->descripcion = $validated['descripcion'] ?? null;
        $estado->idtipoentidad = $validated['idtipoentidad'];
        $estado->save();

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado correctamente.',
            'data' => $estado->load('tipoEntidad')->loadCount([
                'noticias',
                'documentos',
                'eventos',
                'eventosInscripciones',
                'tutoriales',
                'faqs',
                'solicitudesSoporte',
                'proyectos',
            ]),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $estado = Estado::withCount([
            'noticias',
            'documentos',
            'eventos',
            'eventosInscripciones',
            'tutoriales',
            'faqs',
            'solicitudesSoporte',
            'proyectos',
        ])->find($id);

        if (!$estado) {
            return response()->json([
                'success' => false,
                'message' => 'El estado no existe.',
            ], 404);
        }

        if (
            $estado->noticias_count > 0 ||
            $estado->documentos_count > 0 ||
            $estado->eventos_count > 0 ||
            $estado->eventos_inscripciones_count > 0 ||
            $estado->tutoriales_count > 0 ||
            $estado->faqs_count > 0 ||
            $estado->solicitudes_soporte_count > 0 ||
            $estado->proyectos_count > 0
        ) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el estado porque tiene registros asociados.',
                'data' => [
                    'noticias' => $estado->noticias_count,
                    'documentos' => $estado->documentos_count,
                    'eventos' => $estado->eventos_count,
                    'eventos_inscripciones' => $estado->eventos_inscripciones_count,
                    'tutoriales' => $estado->tutoriales_count,
                    'faqs' => $estado->faqs_count,
                    'solicitudes_soporte' => $estado->solicitudes_soporte_count,
                    'proyectos' => $estado->proyectos_count,
                ],
            ], 409);
        }

        $estado->delete();

        return response()->json([
            'success' => true,
            'message' => 'Estado eliminado correctamente.',
        ]);
    }
}
