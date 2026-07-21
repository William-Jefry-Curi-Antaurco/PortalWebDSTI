<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UsuarioTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_crea_un_usuario_con_password_hasheado(): void
    {
        $this->actingAsRol('admin');

        $idrolEditor = Rol::where('nombre', 'editor')->value('idrol');

        $response = $this->postJson('/api/admin/usuarios', [
            'nombre_completo' => 'Nuevo Editor',
            'email' => 'nuevo.editor@dsti.test',
            'password' => 'clave-segura-123',
            'idrol' => $idrolEditor,
        ]);

        $response->assertCreated()
            ->assertJsonMissingPath('data.password_hash');

        $usuario = User::where('email', 'nuevo.editor@dsti.test')->first();

        $this->assertNotNull($usuario);
        $this->assertTrue(Hash::check('clave-segura-123', $usuario->password_hash));
    }

    public function test_no_permite_correos_duplicados(): void
    {
        $existente = $this->actingAsRol('admin');

        $this->postJson('/api/admin/usuarios', [
            'nombre_completo' => 'Otro usuario',
            'email' => $existente->email,
            'password' => 'clave-segura-123',
            'idrol' => Rol::where('nombre', 'lector')->value('idrol'),
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_cambiar_password_actualiza_el_hash_y_revoca_tokens(): void
    {
        $this->actingAsRol('admin');

        $usuario = User::factory()->conRol('editor')->create();
        $usuario->createToken('sesion-anterior');

        $this->assertSame(1, $usuario->tokens()->count());

        $this->putJson("/api/admin/usuarios/{$usuario->idusuario}/password", [
            'password' => 'clave-nueva-123',
            'password_confirmation' => 'clave-nueva-123',
        ])->assertOk();

        $usuario->refresh();

        $this->assertTrue(Hash::check('clave-nueva-123', $usuario->password_hash));
        $this->assertSame(0, $usuario->tokens()->count());
    }

    public function test_activa_y_desactiva_un_usuario(): void
    {
        $this->actingAsRol('admin');

        $usuario = User::factory()->conRol('editor')->inactivo()->create();

        $this->putJson("/api/admin/usuarios/{$usuario->idusuario}/activar")
            ->assertOk()
            ->assertJsonPath('data.activo', true);

        $this->putJson("/api/admin/usuarios/{$usuario->idusuario}/desactivar")
            ->assertOk()
            ->assertJsonPath('data.activo', false);
    }

    public function test_no_puede_desactivarse_a_si_mismo(): void
    {
        $admin = $this->actingAsRol('admin');

        $this->putJson("/api/admin/usuarios/{$admin->idusuario}/desactivar")
            ->assertStatus(409);
    }

    public function test_no_puede_eliminarse_a_si_mismo(): void
    {
        $admin = $this->actingAsRol('admin');

        $this->deleteJson("/api/admin/usuarios/{$admin->idusuario}")
            ->assertStatus(409);
    }

    public function test_editor_no_puede_gestionar_usuarios(): void
    {
        $this->actingAsRol('editor');

        $this->getJson('/api/admin/usuarios')->assertStatus(403);
        $this->postJson('/api/admin/usuarios', [])->assertStatus(403);
    }
}
