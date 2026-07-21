<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class FaqController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Faq::with([
            'categoria',
            'autor',
            'estado',
        ])
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('pregunta', 'like', "%{$buscar}%")
                    ->orWhere('respuesta', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        if ($request->filled('idestado')) {
            $query->where('idestado', $request->idestado);
        }

        $faqs = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de preguntas frecuentes obtenido correctamente.',
            'data' => $faqs,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'pregunta' => [
                'required',
                'string',
                'max:255',
                'unique:faqs,pregunta',
            ],
            'respuesta' => [
                'required',
                'string',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:65535',
            ],
            'idcategoria' => [
                'required',
                'integer',
                'exists:categorias,idcategoria',
            ],
            'idestado' => [
                'required',
                'integer',
                'exists:estados,idestado',
            ],
        ], [
            'pregunta.required' => 'La pregunta es obligatoria.',
            'pregunta.unique' => 'Ya existe una pregunta frecuente con ese texto.',
            'pregunta.max' => 'La pregunta no debe superar los 255 caracteres.',
            'respuesta.required' => 'La respuesta es obligatoria.',
            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $faq = Faq::create([
            'pregunta' => $request->pregunta,
            'respuesta' => $request->respuesta,
            'orden' => $request->orden ?? 0,
            'veces_util' => 0,
            'idcategoria' => $request->idcategoria,
            'idusuario_autor' => $request->user()->idusuario,
            'idestado' => $request->idestado,
        ]);

        $faq->load([
            'categoria',
            'autor',
            'estado',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pregunta frecuente registrada correctamente.',
            'data' => $faq,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $faq = Faq::with([
            'categoria',
            'autor',
            'estado',
        ])->find($id);

        if (!$faq) {
            return response()->json([
                'success' => false,
                'message' => 'Pregunta frecuente no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pregunta frecuente obtenida correctamente.',
            'data' => $faq,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $faq = Faq::find($id);

        if (!$faq) {
            return response()->json([
                'success' => false,
                'message' => 'Pregunta frecuente no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'pregunta' => [
                'required',
                'string',
                'max:255',
                Rule::unique('faqs', 'pregunta')->ignore($faq->idfaq, 'idfaq'),
            ],
            'respuesta' => [
                'required',
                'string',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:65535',
            ],
            'veces_util' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'idcategoria' => [
                'required',
                'integer',
                'exists:categorias,idcategoria',
            ],
            'idestado' => [
                'required',
                'integer',
                'exists:estados,idestado',
            ],
        ], [
            'pregunta.required' => 'La pregunta es obligatoria.',
            'pregunta.unique' => 'Ya existe una pregunta frecuente con ese texto.',
            'pregunta.max' => 'La pregunta no debe superar los 255 caracteres.',
            'respuesta.required' => 'La respuesta es obligatoria.',
            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $faq->update([
            'pregunta' => $request->pregunta,
            'respuesta' => $request->respuesta,
            'orden' => $request->orden ?? 0,
            'veces_util' => $request->veces_util ?? $faq->veces_util,
            'idcategoria' => $request->idcategoria,
            'idestado' => $request->idestado,
        ]);

        $faq->load([
            'categoria',
            'autor',
            'estado',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pregunta frecuente actualizada correctamente.',
            'data' => $faq,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $faq = Faq::find($id);

        if (!$faq) {
            return response()->json([
                'success' => false,
                'message' => 'Pregunta frecuente no encontrada.',
            ], 404);
        }

        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pregunta frecuente eliminada correctamente.',
        ]);
    }
}
