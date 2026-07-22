<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Hash "señuelo" con el mismo costo que las contraseñas reales, usado
     * cuando el correo no existe para que Hash::check() tome un tiempo
     * comparable al de una contraseña incorrecta y no se pueda distinguir
     * por tiempo de respuesta si un correo está registrado o no.
     */
    private const HASH_SENUELO = '$2y$12$R.gzQlCRZ7SNeVF3Wm2Hp.pKFiU.5wAe5i0CWJ1VIYBOiQSPcQqUi';

    public function login(string $email, string $password): array
    {
        $usuario = User::with('rol.permisos')
            ->where('email', $email)
            ->first();

        $credencialesValidas = Hash::check(
            $password,
            $usuario->password_hash ?? self::HASH_SENUELO
        );

        if (!$usuario || !$credencialesValidas) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales ingresadas no son correctas.'],
            ]);
        }

        if (!$usuario->estaActivo()) {
            throw ValidationException::withMessages([
                'email' => ['El usuario se encuentra inactivo.'],
            ]);
        }

        $usuario->update([
            'ultimo_acceso' => now(),
        ]);

        $token = $usuario->createToken('panel-admin')->plainTextToken;

        return [
            'usuario' => $usuario->load('rol.permisos'),
            'token' => $token,
        ];
    }

    /**
     * Revoca el token con el que se autenticó la petición y emite uno nuevo,
     * para que una sesión activa pueda renovarse sin pedir la contraseña de
     * nuevo. Si el usuario se desactivó entre medio, no se renueva.
     */
    public function refrescarToken(User $usuario, \Laravel\Sanctum\PersonalAccessToken $tokenActual): array
    {
        if (!$usuario->estaActivo()) {
            throw ValidationException::withMessages([
                'email' => ['El usuario se encuentra inactivo.'],
            ]);
        }

        $nombreToken = $tokenActual->name;

        $tokenActual->delete();

        $token = $usuario->createToken($nombreToken)->plainTextToken;

        return [
            'usuario' => $usuario->load('rol.permisos'),
            'token' => $token,
        ];
    }
}
