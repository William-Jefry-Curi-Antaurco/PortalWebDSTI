<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('rol')
            ->withCount([
                'noticiasAutor',
                'documentosSubidos',
                'eventosOrganizados',
                'tutorialesAutor',
                'faqsAutor',
                'solicitudesAtendidas',
                'respuestasSoporte',
                'infoInstitucionalEditada',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre_completo', 'like', "%{$buscar}%")
                    ->orWhere('email', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idrol')) {
            $query->where('idrol', $request->idrol);
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        $usuarios = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de usuarios obtenido correctamente.',
            'data' => $usuarios,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_completo' => [
                'required',
                'string',
                'max:150',
            ],
            'email' => [
                'required',
                'email',
                'max:150',
                'unique:usuarios,email',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'max:100',
            ],
            'idrol' => [
                'required',
                'integer',
                'exists:roles,idrol',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
            'email_verified_at' => [
                'nullable',
                'date',
            ],
        ], [
            'nombre_completo.required' => 'El nombre completo es obligatorio.',
            'nombre_completo.max' => 'El nombre completo no debe superar los 150 caracteres.',

            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'email.max' => 'El correo electrónico no debe superar los 150 caracteres.',
            'email.unique' => 'Ya existe un usuario con ese correo electrónico.',

            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener como mínimo 8 caracteres.',
            'password.max' => 'La contraseña no debe superar los 100 caracteres.',

            'idrol.required' => 'El rol es obligatorio.',
            'idrol.exists' => 'El rol seleccionado no existe.',

            'email_verified_at.date' => 'La fecha de verificación de correo no tiene un formato válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $usuario = User::create([
            'nombre_completo' => $request->nombre_completo,
            'email' => $request->email,
            'email_verified_at' => $request->email_verified_at,
            'password_hash' => Hash::make($request->password),
            'idrol' => $request->idrol,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
        ]);

        $usuario->load('rol');

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado correctamente.',
            'data' => $usuario,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $usuario = User::with('rol')
            ->withCount([
                'noticiasAutor',
                'documentosSubidos',
                'eventosOrganizados',
                'tutorialesAutor',
                'faqsAutor',
                'solicitudesAtendidas',
                'respuestasSoporte',
                'infoInstitucionalEditada',
            ])
            ->find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Usuario obtenido correctamente.',
            'data' => $usuario,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre_completo' => [
                'required',
                'string',
                'max:150',
            ],
            'email' => [
                'required',
                'email',
                'max:150',
                Rule::unique('usuarios', 'email')->ignore($usuario->idusuario, 'idusuario'),
            ],
            'idrol' => [
                'required',
                'integer',
                'exists:roles,idrol',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
            'email_verified_at' => [
                'nullable',
                'date',
            ],
        ], [
            'nombre_completo.required' => 'El nombre completo es obligatorio.',
            'nombre_completo.max' => 'El nombre completo no debe superar los 150 caracteres.',

            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'email.max' => 'El correo electrónico no debe superar los 150 caracteres.',
            'email.unique' => 'Ya existe un usuario con ese correo electrónico.',

            'idrol.required' => 'El rol es obligatorio.',
            'idrol.exists' => 'El rol seleccionado no existe.',

            'email_verified_at.date' => 'La fecha de verificación de correo no tiene un formato válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $usuario->update([
            'nombre_completo' => $request->nombre_completo,
            'email' => $request->email,
            'email_verified_at' => $request->email_verified_at,
            'idrol' => $request->idrol,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
        ]);

        $usuario->load('rol');

        return response()->json([
            'success' => true,
            'message' => 'Usuario actualizado correctamente.',
            'data' => $usuario,
        ]);
    }

    public function cambiarPassword(Request $request, int $id): JsonResponse
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'password' => [
                'required',
                'string',
                'min:8',
                'max:100',
                'confirmed',
            ],
        ], [
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.min' => 'La nueva contraseña debe tener como mínimo 8 caracteres.',
            'password.max' => 'La nueva contraseña no debe superar los 100 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $usuario->update([
            'password_hash' => Hash::make($request->password),
        ]);

        $usuario->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente. Las sesiones del usuario fueron cerradas.',
        ]);
    }

    public function activar(int $id): JsonResponse
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $usuario->update([
            'activo' => true,
        ]);

        $usuario->load('rol');

        return response()->json([
            'success' => true,
            'message' => 'Usuario activado correctamente.',
            'data' => $usuario,
        ]);
    }

    public function desactivar(Request $request, int $id): JsonResponse
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        if ($request->user()->idusuario === $usuario->idusuario) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes desactivar tu propio usuario.',
            ], 409);
        }

        $usuario->update([
            'activo' => false,
        ]);

        $usuario->tokens()->delete();

        $usuario->load('rol');

        return response()->json([
            'success' => true,
            'message' => 'Usuario desactivado correctamente. Sus sesiones fueron cerradas.',
            'data' => $usuario,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $usuario = User::withCount([
            'noticiasAutor',
            'documentosSubidos',
            'eventosOrganizados',
            'tutorialesAutor',
            'faqsAutor',
            'solicitudesAtendidas',
            'respuestasSoporte',
            'infoInstitucionalEditada',
        ])->find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        if ($request->user()->idusuario === $usuario->idusuario) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar tu propio usuario.',
            ], 409);
        }

        if (
            $usuario->noticias_autor_count > 0 ||
            $usuario->documentos_subidos_count > 0 ||
            $usuario->eventos_organizados_count > 0 ||
            $usuario->tutoriales_autor_count > 0 ||
            $usuario->faqs_autor_count > 0 ||
            $usuario->solicitudes_atendidas_count > 0 ||
            $usuario->respuestas_soporte_count > 0 ||
            $usuario->info_institucional_editada_count > 0
        ) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el usuario porque tiene registros asociados.',
                'data' => [
                    'noticias' => $usuario->noticias_autor_count,
                    'documentos' => $usuario->documentos_subidos_count,
                    'eventos_organizados' => $usuario->eventos_organizados_count,
                    'tutoriales' => $usuario->tutoriales_autor_count,
                    'faqs' => $usuario->faqs_autor_count,
                    'solicitudes_atendidas' => $usuario->solicitudes_atendidas_count,
                    'respuestas_soporte' => $usuario->respuestas_soporte_count,
                    'info_institucional_editada' => $usuario->info_institucional_editada_count,
                ],
            ], 409);
        }

        $usuario->tokens()->delete();
        $usuario->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado correctamente.',
        ]);
    }
}
