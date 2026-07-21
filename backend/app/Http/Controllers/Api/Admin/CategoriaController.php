<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = Categoria::with('modulo')
            ->withCount([
                'noticias',
                'servicios',
                'enlacesSistemas',
                'documentos',
                'eventos',
                'tutoriales',
                'faqs',
                'proyectos',
            ])
            ->orderBy('idmodulo')
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de categorías obtenido correctamente.',
            'data' => $categorias,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $categoria = Categoria::with('modulo')
            ->withCount([
                'noticias',
                'servicios',
                'enlacesSistemas',
                'documentos',
                'eventos',
                'tutoriales',
                'faqs',
                'proyectos',
            ])
            ->find($id);

        if (!$categoria) {
            return response()->json([
                'success' => false,
                'message' => 'La categoría no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Categoría obtenida correctamente.',
            'data' => $categoria,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
            'idmodulo' => [
                'required',
                'integer',
                'exists:modulos,idmodulo',
            ],
        ]);

        $slugBase = Str::slug($validated['nombre']);
        $slug = $slugBase;
        $contador = 1;

        while (
        Categoria::where('idmodulo', $validated['idmodulo'])
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $categoria = Categoria::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'orden' => $validated['orden'] ?? 0,
            'activo' => $validated['activo'] ?? true,
            'idmodulo' => $validated['idmodulo'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Categoría registrada correctamente.',
            'data' => $categoria->load('modulo'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json([
                'success' => false,
                'message' => 'La categoría no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
            'idmodulo' => [
                'required',
                'integer',
                'exists:modulos,idmodulo',
            ],
        ]);

        if (
            $categoria->nombre !== $validated['nombre'] ||
            $categoria->idmodulo !== (int) $validated['idmodulo']
        ) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            Categoria::where('idmodulo', $validated['idmodulo'])
                ->where('slug', $slug)
                ->where('idcategoria', '!=', $categoria->idcategoria)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $categoria->slug = $slug;
        }

        $categoria->nombre = $validated['nombre'];
        $categoria->descripcion = $validated['descripcion'] ?? null;
        $categoria->orden = $validated['orden'] ?? $categoria->orden;
        $categoria->activo = $validated['activo'] ?? $categoria->activo;
        $categoria->idmodulo = $validated['idmodulo'];
        $categoria->save();

        return response()->json([
            'success' => true,
            'message' => 'Categoría actualizada correctamente.',
            'data' => $categoria->load('modulo')->loadCount([
                'noticias',
                'servicios',
                'enlacesSistemas',
                'documentos',
                'eventos',
                'tutoriales',
                'faqs',
                'proyectos',
            ]),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $categoria = Categoria::withCount([
            'noticias',
            'servicios',
            'enlacesSistemas',
            'documentos',
            'eventos',
            'tutoriales',
            'faqs',
            'proyectos',
        ])->find($id);

        if (!$categoria) {
            return response()->json([
                'success' => false,
                'message' => 'La categoría no existe.',
            ], 404);
        }

        if (
            $categoria->noticias_count > 0 ||
            $categoria->servicios_count > 0 ||
            $categoria->enlaces_sistemas_count > 0 ||
            $categoria->documentos_count > 0 ||
            $categoria->eventos_count > 0 ||
            $categoria->tutoriales_count > 0 ||
            $categoria->faqs_count > 0 ||
            $categoria->proyectos_count > 0
        ) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la categoría porque tiene registros asociados.',
                'data' => [
                    'noticias' => $categoria->noticias_count,
                    'servicios' => $categoria->servicios_count,
                    'sistemas_institucionales' => $categoria->enlaces_sistemas_count,
                    'documentos' => $categoria->documentos_count,
                    'eventos' => $categoria->eventos_count,
                    'tutoriales' => $categoria->tutoriales_count,
                    'faqs' => $categoria->faqs_count,
                    'proyectos' => $categoria->proyectos_count,
                ],
            ], 409);
        }

        $categoria->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada correctamente.',
        ]);
    }
}
