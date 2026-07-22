<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $resultado = $this->authService->login(
            $request->validated('email'),
            $request->validated('password')
        );

        $usuario = $resultado['usuario'];

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión correcto.',
            'data' => [
                'token' => $resultado['token'],
                'token_type' => 'Bearer',
                'usuario' => [
                    'idusuario' => $usuario->idusuario,
                    'nombre_completo' => $usuario->nombre_completo,
                    'email' => $usuario->email,
                    'idrol' => $usuario->idrol,
                    'rol' => $usuario->rol?->nombre,
                    'permisos' => $usuario->rol?->permisos->pluck('nombre')->values() ?? [],
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $usuario = $request->user()->load('rol.permisos');

        return response()->json([
            'success' => true,
            'data' => [
                'usuario' => [
                    'idusuario' => $usuario->idusuario,
                    'nombre_completo' => $usuario->nombre_completo,
                    'email' => $usuario->email,
                    'idrol' => $usuario->idrol,
                    'rol' => $usuario->rol?->nombre,
                    'permisos' => $usuario->rol?->permisos->pluck('nombre')->values() ?? [],
                ],
            ],
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $resultado = $this->authService->refrescarToken(
            $request->user(),
            $request->user()->currentAccessToken()
        );

        $usuario = $resultado['usuario'];

        return response()->json([
            'success' => true,
            'message' => 'Sesión renovada correctamente.',
            'data' => [
                'token' => $resultado['token'],
                'token_type' => 'Bearer',
                'usuario' => [
                    'idusuario' => $usuario->idusuario,
                    'nombre_completo' => $usuario->nombre_completo,
                    'email' => $usuario->email,
                    'idrol' => $usuario->idrol,
                    'rol' => $usuario->rol?->nombre,
                    'permisos' => $usuario->rol?->permisos->pluck('nombre')->values() ?? [],
                ],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
