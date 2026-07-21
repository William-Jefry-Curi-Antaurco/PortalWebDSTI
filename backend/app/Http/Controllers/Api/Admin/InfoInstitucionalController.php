<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InfoInstitucional;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InfoInstitucionalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = InfoInstitucional::with('editor')
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('clave', 'like', "%{$buscar}%")
                    ->orWhere('titulo', 'like', "%{$buscar}%")
                    ->orWhere('contenido', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        $info = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de información institucional obtenido correctamente.',
            'data' => $info,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'clave' => [
                'required',
                'string',
                'max:50',
                'unique:info_institucional,clave',
            ],
            'titulo' => [
                'required',
                'string',
                'max:200',
            ],
            'contenido' => [
                'required',
                'string',
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
        ], [
            'clave.required' => 'La clave es obligatoria.',
            'clave.unique' => 'Ya existe información institucional con esa clave.',
            'clave.max' => 'La clave no debe superar los 50 caracteres.',
            'titulo.required' => 'El título es obligatorio.',
            'titulo.max' => 'El título no debe superar los 200 caracteres.',
            'contenido.required' => 'El contenido es obligatorio.',
            'orden.integer' => 'El orden debe ser un número entero.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $clave = Str::slug($request->clave, '_');

        if (InfoInstitucional::where('clave', $clave)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe información institucional con esa clave.',
                'errors' => [
                    'clave' => ['Ya existe información institucional con esa clave.'],
                ],
            ], 422);
        }

        $info = InfoInstitucional::create([
            'clave' => $clave,
            'titulo' => $request->titulo,
            'contenido' => $request->contenido,
            'orden' => $request->orden ?? 0,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
            'idusuario_editor' => $request->user()->idusuario,
        ]);

        $info->load('editor');

        return response()->json([
            'success' => true,
            'message' => 'Información institucional registrada correctamente.',
            'data' => $info,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $info = InfoInstitucional::with('editor')->find($id);

        if (!$info) {
            return response()->json([
                'success' => false,
                'message' => 'Información institucional no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Información institucional obtenida correctamente.',
            'data' => $info,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $info = InfoInstitucional::find($id);

        if (!$info) {
            return response()->json([
                'success' => false,
                'message' => 'Información institucional no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'clave' => [
                'required',
                'string',
                'max:50',
                Rule::unique('info_institucional', 'clave')->ignore($info->idinfo, 'idinfo'),
            ],
            'titulo' => [
                'required',
                'string',
                'max:200',
            ],
            'contenido' => [
                'required',
                'string',
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
        ], [
            'clave.required' => 'La clave es obligatoria.',
            'clave.unique' => 'Ya existe información institucional con esa clave.',
            'clave.max' => 'La clave no debe superar los 50 caracteres.',
            'titulo.required' => 'El título es obligatorio.',
            'titulo.max' => 'El título no debe superar los 200 caracteres.',
            'contenido.required' => 'El contenido es obligatorio.',
            'orden.integer' => 'El orden debe ser un número entero.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $clave = Str::slug($request->clave, '_');

        $existeClave = InfoInstitucional::where('clave', $clave)
            ->where('idinfo', '!=', $info->idinfo)
            ->exists();

        if ($existeClave) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe información institucional con esa clave.',
                'errors' => [
                    'clave' => ['Ya existe información institucional con esa clave.'],
                ],
            ], 422);
        }

        $info->update([
            'clave' => $clave,
            'titulo' => $request->titulo,
            'contenido' => $request->contenido,
            'orden' => $request->orden ?? 0,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
            'idusuario_editor' => $request->user()->idusuario,
        ]);

        $info->load('editor');

        return response()->json([
            'success' => true,
            'message' => 'Información institucional actualizada correctamente.',
            'data' => $info,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $info = InfoInstitucional::find($id);

        if (!$info) {
            return response()->json([
                'success' => false,
                'message' => 'Información institucional no encontrada.',
            ], 404);
        }

        $info->delete();

        return response()->json([
            'success' => true,
            'message' => 'Información institucional eliminada correctamente.',
        ]);
    }
}
