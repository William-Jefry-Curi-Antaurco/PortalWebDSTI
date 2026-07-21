<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $email, string $password): array
    {
        $usuario = User::with('rol.permisos')
            ->where('email', $email)
            ->first();

        if (!$usuario || !Hash::check($password, $usuario->password_hash)) {
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
}
