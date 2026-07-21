<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\NoticiaController;
use App\Http\Controllers\Api\Admin\ModuloController;
use App\Http\Controllers\Api\Admin\CategoriaController;
use App\Http\Controllers\Api\Admin\TipoEntidadController;
use App\Http\Controllers\Api\Admin\EstadoController;
use App\Http\Controllers\Api\Admin\TipoPublicacionController;
use App\Http\Controllers\Api\Admin\TipoDocumentoController;
use App\Http\Controllers\Api\Admin\EstadoOperativoController;
use App\Http\Controllers\Api\Admin\TipoEventoController;
use App\Http\Controllers\Api\Admin\ModalidadEventoController;
use App\Http\Controllers\Api\Admin\TipoTutorialController;
use App\Http\Controllers\Api\Admin\TipoSoporteController;
use App\Http\Controllers\Api\Admin\PrioridadController;
use App\Http\Controllers\Api\Admin\ServicioController;
use App\Http\Controllers\Api\Admin\EnlaceSistemaController;
use App\Http\Controllers\Api\Admin\DocumentoController;
use App\Http\Controllers\Api\Admin\EventoController;
use App\Http\Controllers\Api\Admin\TutorialController;
use App\Http\Controllers\Api\Admin\FaqController;
use App\Http\Controllers\Api\Admin\SolicitudSoporteController;
use App\Http\Controllers\Api\Admin\InfoInstitucionalController;
use App\Http\Controllers\Api\Admin\AutoridadController;
use App\Http\Controllers\Api\Admin\ProyectoController;
use App\Http\Controllers\Api\Admin\EtiquetaController;
use App\Http\Controllers\Api\Admin\LogActividadController;
use App\Http\Middleware\SetUsuarioAuditoria;
use App\Http\Controllers\Api\Admin\PermisoController;
use App\Http\Controllers\Api\Admin\RolController;
use App\Http\Controllers\Api\Admin\UsuarioController;
use App\Http\Controllers\Api\Public\PortalPublicController;
use App\Http\Controllers\Api\Admin\ConfiguracionController; // ← NUEVO



/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::post('/login', 'login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', 'me');
        Route::post('/logout', 'logout');
    });
});



/*
|--------------------------------------------------------------------------
| Portal público
|--------------------------------------------------------------------------
*/


Route::get('/public/configuracion', [ConfiguracionController::class, 'publico'])
    ->middleware(['throttle:public-api'])
    ->name('public.configuracion');

Route::prefix('public')
    ->name('public.')
    ->controller(PortalPublicController::class)
    ->middleware(['throttle:public-api', 'mantenimiento'])
    ->group(function () {

        Route::get('/inicio', 'inicio')->name('inicio');
        Route::get('/catalogos', 'catalogos')->name('catalogos');

        Route::get('/institucional', 'institucional')->name('institucional');
        Route::get('/autoridades', 'autoridades')->name('autoridades');

        Route::get('/servicios', 'servicios')->name('servicios.index');
        Route::get('/sistemas', 'sistemas')->name('sistemas.index');

        Route::get('/proyectos', 'proyectos')->name('proyectos.index');

        Route::get('/noticias', 'noticias')->name('noticias.index');
        Route::get('/noticias/{slug}', 'noticiaDetalle')
            ->where('slug', '[A-Za-z0-9\-]+')
            ->name('noticias.show');

        Route::get('/documentos', 'documentos')->name('documentos.index');
        Route::get('/documentos/{slug}', 'documentoDetalle')
            ->where('slug', '[A-Za-z0-9\-]+')
            ->name('documentos.show');

        Route::get('/eventos', 'eventos')->name('eventos.index');
        Route::get('/eventos/{slug}', 'eventoDetalle')
            ->where('slug', '[A-Za-z0-9\-]+')
            ->name('eventos.show');

        Route::get('/tutoriales', 'tutoriales')->name('tutoriales.index');
        Route::get('/tutoriales/{slug}', 'tutorialDetalle')
            ->where('slug', '[A-Za-z0-9\-]+')
            ->name('tutoriales.show');

        Route::get('/faqs', 'faqs')->name('faqs.index');

        Route::post('/soporte', 'registrarSoporte')
            ->middleware(['throttle:soporte-publico'])
            ->name('soporte.store');
    });



/*
|--------------------------------------------------------------------------
| Admin — protegido por auth:sanctum + role:admin + auditoría
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:admin', SetUsuarioAuditoria::class])
    ->prefix('admin')
    ->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::prefix('configuracion')
            ->controller(ConfiguracionController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::put('/', 'update');
                Route::post('/archivo', 'updateArchivo');
                Route::delete('/archivo/{clave}', 'eliminarArchivo');
            });



        Route::prefix('modulos')
            ->controller(ModuloController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('categorias')
            ->controller(CategoriaController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('tipos-entidad')
            ->controller(TipoEntidadController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('estados')
            ->controller(EstadoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('tipos-publicacion')
            ->controller(TipoPublicacionController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('tipos-documento')
            ->controller(TipoDocumentoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('estados-operativos')
            ->controller(EstadoOperativoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('tipos-evento')
            ->controller(TipoEventoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('modalidades-evento')
            ->controller(ModalidadEventoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('tipos-tutorial')
            ->controller(TipoTutorialController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('tipos-soporte')
            ->controller(TipoSoporteController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('prioridades')
            ->controller(PrioridadController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        // ── Módulos funcionales ───────────────────────────────────────────────

        Route::prefix('servicios')
            ->controller(ServicioController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('enlaces-sistemas')
            ->controller(EnlaceSistemaController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('documentos')
            ->controller(DocumentoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('eventos')
            ->controller(EventoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'destroy');

                Route::post('/{id}/archivos', 'subirArchivo');
                Route::post('/archivos/{id}', 'actualizarArchivo');
                Route::delete('/archivos/{id}', 'eliminarArchivo');
            });

        Route::prefix('tutoriales')
            ->controller(TutorialController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('faqs')
            ->controller(FaqController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('solicitudes-soporte')
            ->controller(SolicitudSoporteController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'destroy');

                Route::post('/{id}/respuestas', 'responder');
                Route::delete('/respuestas/{id}', 'eliminarRespuesta');
            });

        // ── Institucional ─────────────────────────────────────────────────────

        Route::prefix('info-institucional')
            ->controller(InfoInstitucionalController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('autoridades')
            ->controller(AutoridadController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('proyectos')
            ->controller(ProyectoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        // ── Etiquetas ─────────────────────────────────────────────────────────

        Route::prefix('etiquetas')
            ->controller(EtiquetaController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');

                Route::post('/contenido/asignar', 'asignarContenido');
                Route::get('/contenido/listar', 'etiquetasPorContenido');
                Route::delete('/contenido/quitar', 'quitarContenido');
            });

        // ── Seguridad ─────────────────────────────────────────────────────────

        Route::prefix('permisos')
            ->controller(PermisoController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });

        Route::prefix('roles')
            ->controller(RolController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');

                Route::post('/{id}/permisos', 'asignarPermiso');
                Route::delete('/{id}/permisos', 'quitarPermiso');
                Route::put('/{id}/permisos/sincronizar', 'sincronizarPermisos');
            });

        Route::prefix('usuarios')
            ->controller(UsuarioController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');

                Route::put('/{id}/password', 'cambiarPassword');
                Route::put('/{id}/activar', 'activar');
                Route::put('/{id}/desactivar', 'desactivar');
            });

        // ── Noticias ──────────────────────────────────────────────────────────

        Route::prefix('noticias')
            ->controller(NoticiaController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{id}', 'show');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');

                Route::post('/{id}/imagenes', 'subirImagen');
            });

        Route::prefix('noticias/imagenes')
            ->controller(NoticiaController::class)
            ->group(function () {
                Route::post('/{id}', 'actualizarImagen');
                Route::delete('/{id}', 'eliminarImagen');
            });

        // ── Auditoría ─────────────────────────────────────────────────────────

        Route::prefix('logs-actividad')
            ->controller(LogActividadController::class)
            ->group(function () {
                Route::get('/', 'index');
                Route::get('/{id}', 'show');
                Route::delete('/{id}', 'destroy');
                Route::delete('/', 'limpiar');
            });
    });
