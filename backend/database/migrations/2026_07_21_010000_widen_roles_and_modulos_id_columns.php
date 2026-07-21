<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * roles.idrol y modulos.idmodulo eran tinyint unsigned (máx. 255). En uso
 * normal del portal nunca se acercan a ese límite, pero la suite de tests
 * los re-siembra en cada test (RolesYPermisosSeeder corre en el setUp de
 * casi todos), y como InnoDB no reutiliza valores de AUTO_INCREMENT tras
 * un rollback de transacción, un run completo de la suite agota el rango
 * de un tinyint. Se amplían a smallint unsigned (máx. 65535): 1 byte extra
 * por fila, irrelevante para ~11 módulos / 3 roles reales.
 *
 * Hay que ampliar también las columnas hijas de las llaves foráneas
 * (categorias.idmodulo, permisos.idmodulo, roles_permisos.idrol,
 * usuarios.idrol) porque MySQL no permite que difiera el tipo entre una
 * FK y la columna referenciada.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE `categorias` DROP FOREIGN KEY `fk_categorias_modulos1`');
        DB::statement('ALTER TABLE `permisos` DROP FOREIGN KEY `fk_permisos_modulos1`');
        DB::statement('ALTER TABLE `roles_permisos` DROP FOREIGN KEY `fk_roles_has_permisos_roles1`');
        DB::statement('ALTER TABLE `usuarios` DROP FOREIGN KEY `fk_usuarios_rol`');

        DB::statement('ALTER TABLE `modulos` MODIFY `idmodulo` smallint unsigned NOT NULL AUTO_INCREMENT');
        DB::statement('ALTER TABLE `roles` MODIFY `idrol` smallint unsigned NOT NULL AUTO_INCREMENT');

        DB::statement('ALTER TABLE `categorias` MODIFY `idmodulo` smallint unsigned NOT NULL');
        DB::statement('ALTER TABLE `permisos` MODIFY `idmodulo` smallint unsigned NOT NULL');
        DB::statement('ALTER TABLE `roles_permisos` MODIFY `idrol` smallint unsigned NOT NULL');
        DB::statement('ALTER TABLE `usuarios` MODIFY `idrol` smallint unsigned NOT NULL');

        DB::statement('ALTER TABLE `categorias` ADD CONSTRAINT `fk_categorias_modulos1` FOREIGN KEY (`idmodulo`) REFERENCES `modulos` (`idmodulo`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        DB::statement('ALTER TABLE `permisos` ADD CONSTRAINT `fk_permisos_modulos1` FOREIGN KEY (`idmodulo`) REFERENCES `modulos` (`idmodulo`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        DB::statement('ALTER TABLE `roles_permisos` ADD CONSTRAINT `fk_roles_has_permisos_roles1` FOREIGN KEY (`idrol`) REFERENCES `roles` (`idrol`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        DB::statement('ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`idrol`) REFERENCES `roles` (`idrol`) ON DELETE RESTRICT ON UPDATE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `categorias` DROP FOREIGN KEY `fk_categorias_modulos1`');
        DB::statement('ALTER TABLE `permisos` DROP FOREIGN KEY `fk_permisos_modulos1`');
        DB::statement('ALTER TABLE `roles_permisos` DROP FOREIGN KEY `fk_roles_has_permisos_roles1`');
        DB::statement('ALTER TABLE `usuarios` DROP FOREIGN KEY `fk_usuarios_rol`');

        DB::statement('ALTER TABLE `modulos` MODIFY `idmodulo` tinyint unsigned NOT NULL AUTO_INCREMENT');
        DB::statement('ALTER TABLE `roles` MODIFY `idrol` tinyint unsigned NOT NULL AUTO_INCREMENT');

        DB::statement('ALTER TABLE `categorias` MODIFY `idmodulo` tinyint unsigned NOT NULL');
        DB::statement('ALTER TABLE `permisos` MODIFY `idmodulo` tinyint unsigned NOT NULL');
        DB::statement('ALTER TABLE `roles_permisos` MODIFY `idrol` tinyint unsigned NOT NULL');
        DB::statement('ALTER TABLE `usuarios` MODIFY `idrol` tinyint unsigned NOT NULL');

        DB::statement('ALTER TABLE `categorias` ADD CONSTRAINT `fk_categorias_modulos1` FOREIGN KEY (`idmodulo`) REFERENCES `modulos` (`idmodulo`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        DB::statement('ALTER TABLE `permisos` ADD CONSTRAINT `fk_permisos_modulos1` FOREIGN KEY (`idmodulo`) REFERENCES `modulos` (`idmodulo`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        DB::statement('ALTER TABLE `roles_permisos` ADD CONSTRAINT `fk_roles_has_permisos_roles1` FOREIGN KEY (`idrol`) REFERENCES `roles` (`idrol`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        DB::statement('ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`idrol`) REFERENCES `roles` (`idrol`) ON DELETE RESTRICT ON UPDATE CASCADE');
    }
};
