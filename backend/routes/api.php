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

Route::middleware(['auth:sanctum', 'role:admin,editor,lector', SetUsuarioAuditoria::class])
    ->prefix('admin')
    ->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::prefix('configuracion')
            ->controller(ConfiguracionController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::put('/', 'update')->middleware('permission:catalogos.editar');
                Route::post('/archivo', 'updateArchivo')->middleware('permission:catalogos.editar');
                Route::delete('/archivo/{clave}', 'eliminarArchivo')->middleware('permission:catalogos.editar');
            });



        Route::prefix('modulos')
            ->controller(ModuloController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('categorias')
            ->controller(CategoriaController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('tipos-entidad')
            ->controller(TipoEntidadController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('estados')
            ->controller(EstadoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('tipos-publicacion')
            ->controller(TipoPublicacionController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('tipos-documento')
            ->controller(TipoDocumentoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('estados-operativos')
            ->controller(EstadoOperativoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('tipos-evento')
            ->controller(TipoEventoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('modalidades-evento')
            ->controller(ModalidadEventoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('tipos-tutorial')
            ->controller(TipoTutorialController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('tipos-soporte')
            ->controller(TipoSoporteController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        Route::prefix('prioridades')
            ->controller(PrioridadController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');
            });

        // ── Módulos funcionales ───────────────────────────────────────────────

        Route::prefix('servicios')
            ->controller(ServicioController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:servicios.ver');
                Route::post('/', 'store')->middleware('permission:servicios.crear');
                Route::get('/{id}', 'show')->middleware('permission:servicios.ver');
                Route::put('/{id}', 'update')->middleware('permission:servicios.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:servicios.eliminar');
            });

        Route::prefix('enlaces-sistemas')
            ->controller(EnlaceSistemaController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:sistemas.ver');
                Route::post('/', 'store')->middleware('permission:sistemas.crear');
                Route::get('/{id}', 'show')->middleware('permission:sistemas.ver');
                Route::post('/{id}', 'update')->middleware('permission:sistemas.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:sistemas.eliminar');
            });

        Route::prefix('documentos')
            ->controller(DocumentoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:documentos.ver');
                Route::post('/', 'store')->middleware('permission:documentos.crear');
                Route::get('/{id}', 'show')->middleware('permission:documentos.ver');
                Route::post('/{id}', 'update')->middleware('permission:documentos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:documentos.eliminar');
            });

        Route::prefix('eventos')
            ->controller(EventoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:eventos.ver');
                Route::post('/', 'store')->middleware('permission:eventos.crear');
                Route::get('/{id}', 'show')->middleware('permission:eventos.ver');
                Route::post('/{id}', 'update')->middleware('permission:eventos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:eventos.eliminar');

                Route::post('/{id}/archivos', 'subirArchivo')->middleware('permission:eventos.editar');
                Route::post('/archivos/{id}', 'actualizarArchivo')->middleware('permission:eventos.editar');
                Route::delete('/archivos/{id}', 'eliminarArchivo')->middleware('permission:eventos.eliminar');
            });

        Route::prefix('tutoriales')
            ->controller(TutorialController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:tutoriales.ver');
                Route::post('/', 'store')->middleware('permission:tutoriales.crear');
                Route::get('/{id}', 'show')->middleware('permission:tutoriales.ver');
                Route::post('/{id}', 'update')->middleware('permission:tutoriales.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:tutoriales.eliminar');
            });

        // FAQs no tiene módulo propio en la tabla de permisos; se agrupa con
        // "Tutoriales y recursos" porque comparte el patrón ver/crear/editar/eliminar.
        Route::prefix('faqs')
            ->controller(FaqController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:tutoriales.ver');
                Route::post('/', 'store')->middleware('permission:tutoriales.crear');
                Route::get('/{id}', 'show')->middleware('permission:tutoriales.ver');
                Route::put('/{id}', 'update')->middleware('permission:tutoriales.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:tutoriales.eliminar');
            });

        Route::prefix('solicitudes-soporte')
            ->controller(SolicitudSoporteController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:soporte.ver');
                Route::post('/', 'store')->middleware('permission:soporte.responder');
                Route::get('/{id}', 'show')->middleware('permission:soporte.ver');
                Route::post('/{id}', 'update')->middleware('permission:soporte.editar_estado');
                Route::delete('/{id}', 'destroy')->middleware('permission:soporte.eliminar');

                Route::post('/{id}/respuestas', 'responder')->middleware('permission:soporte.responder');
                Route::delete('/respuestas/{id}', 'eliminarRespuesta')->middleware('permission:soporte.eliminar');
            });

        // ── Institucional ─────────────────────────────────────────────────────

        Route::prefix('info-institucional')
            ->controller(InfoInstitucionalController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:institucional.ver');
                Route::post('/', 'store')->middleware('permission:institucional.crear');
                Route::get('/{id}', 'show')->middleware('permission:institucional.ver');
                Route::put('/{id}', 'update')->middleware('permission:institucional.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:institucional.eliminar');
            });

        Route::prefix('autoridades')
            ->controller(AutoridadController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:institucional.ver');
                Route::post('/', 'store')->middleware('permission:institucional.crear');
                Route::get('/{id}', 'show')->middleware('permission:institucional.ver');
                Route::post('/{id}', 'update')->middleware('permission:institucional.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:institucional.eliminar');
            });

        Route::prefix('proyectos')
            ->controller(ProyectoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:proyectos.ver');
                Route::post('/', 'store')->middleware('permission:proyectos.crear');
                Route::get('/{id}', 'show')->middleware('permission:proyectos.ver');
                Route::post('/{id}', 'update')->middleware('permission:proyectos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:proyectos.eliminar');
            });

        // ── Etiquetas ─────────────────────────────────────────────────────────

        Route::prefix('etiquetas')
            ->controller(EtiquetaController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:catalogos.ver');
                Route::post('/', 'store')->middleware('permission:catalogos.crear');
                Route::get('/{id}', 'show')->middleware('permission:catalogos.ver');
                Route::put('/{id}', 'update')->middleware('permission:catalogos.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:catalogos.eliminar');

                Route::post('/contenido/asignar', 'asignarContenido')->middleware('permission:catalogos.editar');
                Route::get('/contenido/listar', 'etiquetasPorContenido')->middleware('permission:catalogos.ver');
                Route::delete('/contenido/quitar', 'quitarContenido')->middleware('permission:catalogos.editar');
            });

        // ── Seguridad ─────────────────────────────────────────────────────────

        Route::prefix('permisos')
            ->controller(PermisoController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:seguridad.ver');
                Route::post('/', 'store')->middleware('permission:seguridad.crear');
                Route::get('/{id}', 'show')->middleware('permission:seguridad.ver');
                Route::put('/{id}', 'update')->middleware('permission:seguridad.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:seguridad.eliminar');
            });

        Route::prefix('roles')
            ->controller(RolController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:seguridad.ver');
                Route::post('/', 'store')->middleware('permission:seguridad.crear');
                Route::get('/{id}', 'show')->middleware('permission:seguridad.ver');
                Route::put('/{id}', 'update')->middleware('permission:seguridad.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:seguridad.eliminar');

                Route::post('/{id}/permisos', 'asignarPermiso')->middleware('permission:seguridad.editar');
                Route::delete('/{id}/permisos', 'quitarPermiso')->middleware('permission:seguridad.editar');
                Route::put('/{id}/permisos/sincronizar', 'sincronizarPermisos')->middleware('permission:seguridad.editar');
            });

        Route::prefix('usuarios')
            ->controller(UsuarioController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:seguridad.ver');
                Route::post('/', 'store')->middleware('permission:seguridad.crear');
                Route::get('/{id}', 'show')->middleware('permission:seguridad.ver');
                Route::put('/{id}', 'update')->middleware('permission:seguridad.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:seguridad.eliminar');

                Route::put('/{id}/password', 'cambiarPassword')->middleware('permission:seguridad.editar');
                Route::put('/{id}/activar', 'activar')->middleware('permission:seguridad.editar');
                Route::put('/{id}/desactivar', 'desactivar')->middleware('permission:seguridad.editar');
            });

        // ── Noticias ──────────────────────────────────────────────────────────

        Route::prefix('noticias')
            ->controller(NoticiaController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:noticias.ver');
                Route::post('/', 'store')->middleware('permission:noticias.crear');
                Route::get('/{id}', 'show')->middleware('permission:noticias.ver');
                Route::put('/{id}', 'update')->middleware('permission:noticias.editar');
                Route::delete('/{id}', 'destroy')->middleware('permission:noticias.eliminar');

                Route::post('/{id}/imagenes', 'subirImagen')->middleware('permission:noticias.editar');
            });

        Route::prefix('noticias/imagenes')
            ->controller(NoticiaController::class)
            ->group(function () {
                Route::post('/{id}', 'actualizarImagen')->middleware('permission:noticias.editar');
                Route::delete('/{id}', 'eliminarImagen')->middleware('permission:noticias.eliminar');
            });

        // ── Auditoría ─────────────────────────────────────────────────────────

        Route::prefix('logs-actividad')
            ->controller(LogActividadController::class)
            ->group(function () {
                Route::get('/', 'index')->middleware('permission:seguridad.ver');
                Route::get('/{id}', 'show')->middleware('permission:seguridad.ver');
                Route::delete('/{id}', 'destroy')->middleware('permission:seguridad.eliminar');
                Route::delete('/', 'limpiar')->middleware('permission:seguridad.eliminar');
            });
    });
