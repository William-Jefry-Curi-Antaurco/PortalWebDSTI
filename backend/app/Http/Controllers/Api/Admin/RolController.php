<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\RolPermiso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RolController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Rol::withCount([
            'usuarios',
            'permisos',
        ])
            ->with('permisos.modulo')
            ->orderBy('nombre');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%");
            });
        }

        $roles = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de roles obtenido correctamente.',
            'data' => $roles,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => [
                'required',
                'string',
                'max:50',
                'unique:roles,nombre',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ], [
            'nombre.required' => 'El nombre del rol es obligatorio.',
            'nombre.unique' => 'Ya existe un rol con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 50 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 255 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rol = Rol::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rol registrado correctamente.',
            'data' => $rol,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $rol = Rol::with([
            'permisos.modulo',
        ])
            ->withCount([
                'usuarios',
                'permisos',
            ])
            ->find($id);

        if (!$rol) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Rol obtenido correctamente.',
            'data' => $rol,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $rol = Rol::find($id);

        if (!$rol) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => [
                'required',
                'string',
                'max:50',
                Rule::unique('roles', 'nombre')->ignore($rol->idrol, 'idrol'),
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ], [
            'nombre.required' => 'El nombre del rol es obligatorio.',
            'nombre.unique' => 'Ya existe un rol con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 50 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 255 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rol->update([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
        ]);

        $rol->load('permisos.modulo');

        return response()->json([
            'success' => true,
            'message' => 'Rol actualizado correctamente.',
            'data' => $rol,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $rol = Rol::withCount([
            'usuarios',
            'permisos',
        ])->find($id);

        if (!$rol) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado.',
            ], 404);
        }

        if ($rol->usuarios_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el rol porque tiene usuarios asociados.',
                'data' => [
                    'usuarios' => $rol->usuarios_count,
                ],
            ], 409);
        }

        if ($rol->permisos_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el rol porque tiene permisos asignados.',
                'data' => [
                    'permisos' => $rol->permisos_count,
                ],
            ], 409);
        }

        $rol->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rol eliminado correctamente.',
        ]);
    }

    public function asignarPermiso(Request $request, int $id): JsonResponse
    {
        $rol = Rol::find($id);

        if (!$rol) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'idpermiso' => [
                'required',
                'integer',
                'exists:permisos,idpermiso',
            ],
        ], [
            'idpermiso.required' => 'El permiso es obligatorio.',
            'idpermiso.exists' => 'El permiso seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $existe = RolPermiso::where('idrol', $rol->idrol)
            ->where('idpermiso', $request->idpermiso)
            ->exists();

        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'El permiso ya está asignado a este rol.',
            ], 409);
        }

        RolPermiso::create([
            'idrol' => $rol->idrol,
            'idpermiso' => $request->idpermiso,
        ]);

        $rol->load('permisos.modulo');

        return response()->json([
            'success' => true,
            'message' => 'Permiso asignado al rol correctamente.',
            'data' => $rol,
        ], 201);
    }

    public function quitarPermiso(Request $request, int $id): JsonResponse
    {
        $rol = Rol::find($id);

        if (!$rol) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'idpermiso' => [
                'required',
                'integer',
                'exists:permisos,idpermiso',
            ],
        ], [
            'idpermiso.required' => 'El permiso es obligatorio.',
            'idpermiso.exists' => 'El permiso seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $eliminado = RolPermiso::where('idrol', $rol->idrol)
            ->where('idpermiso', $request->idpermiso)
            ->delete();

        if ($eliminado === 0) {
            return response()->json([
                'success' => false,
                'message' => 'El permiso no estaba asignado a este rol.',
            ], 404);
        }

        $rol->load('permisos.modulo');

        return response()->json([
            'success' => true,
            'message' => 'Permiso retirado del rol correctamente.',
            'data' => $rol,
        ]);
    }

    public function sincronizarPermisos(Request $request, int $id): JsonResponse
    {
        $rol = Rol::find($id);

        if (!$rol) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'permisos' => [
                'required',
                'array',
            ],
            'permisos.*' => [
                'integer',
                'exists:permisos,idpermiso',
            ],
        ], [
            'permisos.required' => 'Debe enviar la lista de permisos.',
            'permisos.array' => 'Los permisos deben enviarse como un arreglo.',
            'permisos.*.exists' => 'Uno o más permisos seleccionados no existen.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $permisosUnicos = array_values(array_unique($request->permisos));

        $rol->permisos()->sync($permisosUnicos);

        $rol->load('permisos.modulo');

        return response()->json([
            'success' => true,
            'message' => 'Permisos del rol sincronizados correctamente.',
            'data' => $rol,
        ]);
    }
}
