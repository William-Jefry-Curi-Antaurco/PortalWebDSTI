<?php

namespace Database\Seeders;

use App\Models\Modulo;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Seeder;

/**
 * Reproduce la matriz real de roles/permisos del portal: 11 módulos con
 * el patrón ver/crear/editar/eliminar (soporte usa un patrón propio:
 * ver/responder/editar_estado/eliminar), y 3 roles con la misma cobertura
 * que existe hoy en producción.
 */
class RolesYPermisosSeeder extends Seeder
{
    public function run(): void
    {
        $modulos = [
            1 => ['institucional', 'Institucional'],
            2 => ['noticias', 'Noticias y comunicados'],
            3 => ['servicios', 'Servicios tecnológicos'],
            4 => ['sistemas', 'Sistemas institucionales'],
            5 => ['documentos', 'Documentos y manuales'],
            6 => ['eventos', 'Eventos y capacitaciones'],
            7 => ['tutoriales', 'Tutoriales y recursos'],
            8 => ['soporte', 'Mesa de ayuda'],
            9 => ['proyectos', 'Proyectos tecnológicos'],
            10 => ['catalogos', 'Catálogos'],
            11 => ['seguridad', 'Seguridad'],
        ];

        $accionesPorPrefijo = [
            'soporte' => ['ver', 'responder', 'editar_estado', 'eliminar'],
        ];
        $accionesPorDefecto = ['ver', 'crear', 'editar', 'eliminar'];

        foreach ($modulos as $idmodulo => [$prefijo, $nombreModulo]) {
            Modulo::create([
                'idmodulo' => $idmodulo,
                'nombre' => $nombreModulo,
                'slug' => $prefijo,
                'descripcion' => $nombreModulo,
                'activo' => true,
            ]);

            foreach ($accionesPorPrefijo[$prefijo] ?? $accionesPorDefecto as $accion) {
                Permiso::create([
                    'nombre' => "{$prefijo}.{$accion}",
                    'descripcion' => "{$nombreModulo}: {$accion}",
                    'idmodulo' => $idmodulo,
                ]);
            }
        }

        $admin = Rol::create(['nombre' => 'admin', 'descripcion' => 'Administrador general del portal.']);
        $editor = Rol::create(['nombre' => 'editor', 'descripcion' => 'Editor de contenidos institucionales.']);
        $lector = Rol::create(['nombre' => 'lector', 'descripcion' => 'Acceso de solo consulta al panel.']);

        $admin->permisos()->sync(Permiso::pluck('idpermiso'));

        $editor->permisos()->sync(
            Permiso::where('idmodulo', '!=', 11)->pluck('idpermiso')
        );

        $lector->permisos()->sync(
            Permiso::where('nombre', 'like', '%.ver')->pluck('idpermiso')
        );
    }
}
