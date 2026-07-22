<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_login_exitoso_devuelve_token_y_permisos_del_rol(): void
    {
        $usuario = User::factory()->conRol('editor')->create([
            'email' => 'editor@dsti.test',
            'password_hash' => Hash::make('clave-segura'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'editor@dsti.test',
            'password' => 'clave-segura',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.usuario.email', 'editor@dsti.test')
            ->assertJsonPath('data.usuario.rol', 'editor')
            ->assertJsonStructure(['data' => ['token', 'token_type', 'usuario' => ['permisos']]]);

        $permisos = $response->json('data.usuario.permisos');

        $this->assertContains('noticias.crear', $permisos);
        $this->assertNotContains('seguridad.ver', $permisos);
    }

    public function test_login_falla_con_contrasena_incorrecta(): void
    {
        User::factory()->conRol('admin')->create([
            'email' => 'admin@dsti.test',
            'password_hash' => Hash::make('clave-correcta'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@dsti.test',
            'password' => 'clave-incorrecta',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_falla_con_usuario_inexistente(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'no-existe@dsti.test',
            'password' => 'cualquier-clave',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_falla_si_el_usuario_esta_inactivo(): void
    {
        User::factory()->conRol('admin')->inactivo()->create([
            'email' => 'inactivo@dsti.test',
            'password_hash' => Hash::make('clave-segura'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactivo@dsti.test',
            'password' => 'clave-segura',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_valida_campos_obligatorios(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_me_requiere_autenticacion(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_me_devuelve_los_datos_y_permisos_del_usuario_autenticado(): void
    {
        $usuario = $this->actingAsRol('lector');

        $response = $this->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('data.usuario.idusuario', $usuario->idusuario)
            ->assertJsonPath('data.usuario.rol', 'lector');

        $permisos = $response->json('data.usuario.permisos');

        $this->assertContains('noticias.ver', $permisos);
        $this->assertNotContains('noticias.crear', $permisos);
    }

    public function test_refresh_emite_un_token_nuevo_y_revoca_el_anterior(): void
    {
        $usuario = User::factory()->conRol('editor')->create([
            'email' => 'refresh@dsti.test',
            'password_hash' => Hash::make('clave-segura'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'refresh@dsti.test',
            'password' => 'clave-segura',
        ]);

        $tokenAnterior = $login->json('data.token');

        $response = $this->withHeader('Authorization', "Bearer {$tokenAnterior}")
            ->postJson('/api/auth/refresh');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'token_type', 'usuario' => ['permisos']]]);

        $tokenNuevo = $response->json('data.token');

        $this->assertNotSame($tokenAnterior, $tokenNuevo);

        // Solo queda un token en BD: el anterior se borró al refrescar. No
        // repetimos una llamada autenticada con el token viejo aquí porque
        // el guard de Laravel cachea al usuario resuelto durante el mismo
        // test (mismo motivo documentado en test_logout_revoca_el_token_actual).
        $this->assertSame(1, $usuario->fresh()->tokens()->count());
    }

    public function test_refresh_requiere_autenticacion(): void
    {
        $response = $this->postJson('/api/auth/refresh');

        $response->assertStatus(401);
    }

    public function test_logout_revoca_el_token_actual(): void
    {
        $usuario = User::factory()->conRol('admin')->create([
            'email' => 'logout@dsti.test',
            'password_hash' => Hash::make('clave-segura'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'logout@dsti.test',
            'password' => 'clave-segura',
        ]);

        $token = $login->json('data.token');

        $this->assertSame(1, $usuario->tokens()->count());

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertOk();

        // El token dejó de existir en BD: cualquier request futura (en un
        // proceso nuevo, como ocurre en producción) sería rechazada por
        // Sanctum. No repetimos la llamada autenticada aquí porque el guard
        // de Laravel cachea al usuario resuelto durante el mismo test.
        $this->assertSame(0, $usuario->tokens()->count());
    }
}
