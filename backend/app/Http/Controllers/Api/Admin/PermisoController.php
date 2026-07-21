<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permiso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PermisoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Permiso::with('modulo')
            ->withCount('roles')
            ->orderBy('idmodulo')
            ->orderBy('nombre');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idmodulo')) {
            $query->where('idmodulo', $request->idmodulo);
        }

        $permisos = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de permisos obtenido correctamente.',
            'data' => $permisos,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => [
                'required',
                'string',
                'max:105',
                'unique:permisos,nombre',
            ],
            'descripcion' => [
                'required',
                'string',
                'max:200',
            ],
            'idmodulo' => [
                'required',
                'integer',
                'exists:modulos,idmodulo',
            ],
        ], [
            'nombre.required' => 'El nombre del permiso es obligatorio.',
            'nombre.unique' => 'Ya existe un permiso con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 105 caracteres.',
            'descripcion.required' => 'La descripción del permiso es obligatoria.',
            'descripcion.max' => 'La descripción no debe superar los 200 caracteres.',
            'idmodulo.required' => 'El módulo es obligatorio.',
            'idmodulo.exists' => 'El módulo seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $permiso = Permiso::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'idmodulo' => $request->idmodulo,
        ]);

        $permiso->load('modulo');

        return response()->json([
            'success' => true,
            'message' => 'Permiso registrado correctamente.',
            'data' => $permiso,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $permiso = Permiso::with('modulo')
            ->withCount('roles')
            ->find($id);

        if (!$permiso) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Permiso obtenido correctamente.',
            'data' => $permiso,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $permiso = Permiso::find($id);

        if (!$permiso) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => [
                'required',
                'string',
                'max:105',
                Rule::unique('permisos', 'nombre')->ignore($permiso->idpermiso, 'idpermiso'),
            ],
            'descripcion' => [
                'required',
                'string',
                'max:200',
            ],
            'idmodulo' => [
                'required',
                'integer',
                'exists:modulos,idmodulo',
            ],
        ], [
            'nombre.required' => 'El nombre del permiso es obligatorio.',
            'nombre.unique' => 'Ya existe un permiso con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 105 caracteres.',
            'descripcion.required' => 'La descripción del permiso es obligatoria.',
            'descripcion.max' => 'La descripción no debe superar los 200 caracteres.',
            'idmodulo.required' => 'El módulo es obligatorio.',
            'idmodulo.exists' => 'El módulo seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $permiso->update([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'idmodulo' => $request->idmodulo,
        ]);

        $permiso->load('modulo');

        return response()->json([
            'success' => true,
            'message' => 'Permiso actualizado correctamente.',
            'data' => $permiso,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $permiso = Permiso::withCount('roles')->find($id);

        if (!$permiso) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado.',
            ], 404);
        }

        if ($permiso->roles_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el permiso porque está asignado a uno o más roles.',
                'data' => [
                    'roles' => $permiso->roles_count,
                ],
            ], 409);
        }

        $permiso->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permiso eliminado correctamente.',
        ]);
    }
}
