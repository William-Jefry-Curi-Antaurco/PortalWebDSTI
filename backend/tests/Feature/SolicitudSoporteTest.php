<?php

namespace Tests\Feature;

use App\Models\Estado;
use App\Models\Prioridad;
use App\Models\SolicitudRespuesta;
use App\Models\SolicitudSoporte;
use App\Models\TipoEntidad;
use App\Models\TipoSoporte;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SolicitudSoporteTest extends TestCase
{
    use RefreshDatabase;

    private int $idestado;
    private int $idtiposoporte;
    private int $idprioridadBaja;
    private int $idprioridadAlta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);

        $tipoEntidad = TipoEntidad::create(['nombre' => 'Soporte', 'slug' => 'soporte']);

        $this->idestado = Estado::create([
            'nombre' => 'Pendiente', 'slug' => 'pendiente',
            'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->idestado;

        $this->idtiposoporte = TipoSoporte::create([
            'nombre' => 'Correo institucional', 'activo' => true,
        ])->idtiposoporte;

        $this->idprioridadAlta = Prioridad::create([
            'nombre' => 'Alta', 'nivel' => 3, 'dias_respuesta_max' => 1,
        ])->idprioridad;

        $this->idprioridadBaja = Prioridad::create([
            'nombre' => 'Baja', 'nivel' => 1, 'dias_respuesta_max' => 5,
        ])->idprioridad;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'nombres' => 'Juan Pérez',
            'email' => 'juan.perez@example.com',
            'asunto' => 'No puedo acceder a mi correo institucional',
            'descripcion' => 'Intento acceder desde ayer y me dice contraseña incorrecta.',
            'idtiposoporte' => $this->idtiposoporte,
            'idestado' => $this->idestado,
            'consentimiento_privacidad' => 1,
        ], $overrides);
    }

    public function test_crear_sin_prioridad_asigna_la_de_menor_nivel_automaticamente(): void
    {
        $this->actingAsRol('editor');

        $response = $this->postJson('/api/admin/solicitudes-soporte', $this->datosValidos());

        $response->assertCreated()
            ->assertJsonPath('data.idprioridad', $this->idprioridadBaja);
    }

    public function test_crear_con_prioridad_explicita_la_respeta(): void
    {
        $this->actingAsRol('admin');

        $response = $this->postJson('/api/admin/solicitudes-soporte', $this->datosValidos([
            'idprioridad' => $this->idprioridadAlta,
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.idprioridad', $this->idprioridadAlta);
    }

    public function test_valida_campos_obligatorios(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/solicitudes-soporte', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nombres', 'email', 'asunto', 'descripcion', 'idtiposoporte', 'idestado']);
    }

    public function test_responde_una_solicitud(): void
    {
        $this->actingAsRol('editor');

        $solicitud = SolicitudSoporte::create($this->datosValidos() + [
            'codigo_ticket' => 'DSTI-TEST-0001',
            'idprioridad' => $this->idprioridadBaja,
        ]);

        $response = $this->postJson("/api/admin/solicitudes-soporte/{$solicitud->idsolicitud}/respuestas", [
            'mensaje' => 'Hemos restablecido tu contraseña, revisa tu correo.',
        ]);

        $response->assertCreated();
        $this->assertDatabaseCount('solicitudes_respuestas', 1);
    }

    public function test_elimina_una_respuesta(): void
    {
        $usuario = $this->actingAsRol('admin');

        $solicitud = SolicitudSoporte::create($this->datosValidos() + [
            'codigo_ticket' => 'DSTI-TEST-0002',
            'idprioridad' => $this->idprioridadBaja,
        ]);

        $respuesta = SolicitudRespuesta::create([
            'mensaje' => 'Respuesta de prueba',
            'es_interno' => false,
            'idsolicitud' => $solicitud->idsolicitud,
            'idusuario' => $usuario->idusuario,
        ]);

        $this->deleteJson("/api/admin/solicitudes-soporte/respuestas/{$respuesta->idsolicitud_respuesta}")
            ->assertOk();

        $this->assertDatabaseMissing('solicitudes_respuestas', ['idsolicitud_respuesta' => $respuesta->idsolicitud_respuesta]);
    }

    public function test_no_permite_eliminar_una_solicitud_con_respuestas(): void
    {
        $usuario = $this->actingAsRol('admin');

        $solicitud = SolicitudSoporte::create($this->datosValidos() + [
            'codigo_ticket' => 'DSTI-TEST-0003',
            'idprioridad' => $this->idprioridadBaja,
        ]);

        SolicitudRespuesta::create([
            'mensaje' => 'Respuesta de prueba',
            'es_interno' => false,
            'idsolicitud' => $solicitud->idsolicitud,
            'idusuario' => $usuario->idusuario,
        ]);

        $this->deleteJson("/api/admin/solicitudes-soporte/{$solicitud->idsolicitud}")
            ->assertStatus(409);
    }

    public function test_lector_puede_ver_pero_no_responder_solicitudes(): void
    {
        $solicitud = SolicitudSoporte::create($this->datosValidos() + [
            'codigo_ticket' => 'DSTI-TEST-0004',
            'idprioridad' => $this->idprioridadBaja,
        ]);

        $this->actingAsRol('lector');

        $this->getJson('/api/admin/solicitudes-soporte')->assertOk();
        $this->postJson("/api/admin/solicitudes-soporte/{$solicitud->idsolicitud}/respuestas", [
            'mensaje' => 'Intento no autorizado',
        ])->assertStatus(403);
    }
}
