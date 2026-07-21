/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `archivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivos` (
  `idarchivo` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_original` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_guardado` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `extension` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `peso_bytes` bigint unsigned NOT NULL,
  `descargas` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idarchivo`),
  UNIQUE KEY `idx_archivos_nombre_guardado` (`nombre_guardado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_archivos_insert` AFTER INSERT ON `archivos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'subir_archivo',
        'archivos',
        NEW.idarchivo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idarchivo', NEW.idarchivo,
            'nombre_original', NEW.nombre_original,
            'nombre_guardado', NEW.nombre_guardado,
            'ruta', NEW.ruta,
            'extension', NEW.extension,
            'mime_type', NEW.mime_type,
            'peso_bytes', NEW.peso_bytes,
            'descargas', NEW.descargas
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_archivos_update` AFTER UPDATE ON `archivos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'archivos',
        NEW.idarchivo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_original_anterior', OLD.nombre_original,
            'nombre_original_nuevo', NEW.nombre_original,
            'nombre_guardado_anterior', OLD.nombre_guardado,
            'nombre_guardado_nuevo', NEW.nombre_guardado,
            'ruta_anterior', OLD.ruta,
            'ruta_nueva', NEW.ruta,
            'extension_anterior', OLD.extension,
            'extension_nueva', NEW.extension,
            'mime_type_anterior', OLD.mime_type,
            'mime_type_nuevo', NEW.mime_type,
            'peso_bytes_anterior', OLD.peso_bytes,
            'peso_bytes_nuevo', NEW.peso_bytes,
            'descargas_anterior', OLD.descargas,
            'descargas_nuevo', NEW.descargas
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_archivos_delete` AFTER DELETE ON `archivos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar_archivo',
        'archivos',
        OLD.idarchivo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idarchivo', OLD.idarchivo,
            'nombre_original', OLD.nombre_original,
            'nombre_guardado', OLD.nombre_guardado,
            'ruta', OLD.ruta,
            'extension', OLD.extension,
            'mime_type', OLD.mime_type,
            'peso_bytes', OLD.peso_bytes,
            'descargas', OLD.descargas
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `autoridades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autoridades` (
  `idautoridad` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `funciones_principales` text COLLATE utf8mb4_unicode_ci,
  `correo_institucional` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `fecha_inicio_gestion` date DEFAULT NULL,
  `fecha_fin_gestion` date DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idautoridad`),
  KEY `idx_autoridades_activo` (`activo`),
  KEY `idx_autoridades_orden` (`orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_autoridades_insert` AFTER INSERT ON `autoridades` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'autoridades',
        NEW.idautoridad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idautoridad', NEW.idautoridad,
            'nombre_completo', NEW.nombre_completo,
            'cargo', NEW.cargo,
            'correo_institucional', NEW.correo_institucional,
            'foto_url', NEW.foto_url,
            'cv_url', NEW.cv_url,
            'orden', NEW.orden,
            'fecha_inicio_gestion', NEW.fecha_inicio_gestion,
            'fecha_fin_gestion', NEW.fecha_fin_gestion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_autoridades_update` AFTER UPDATE ON `autoridades` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'autoridades',
        NEW.idautoridad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_completo_anterior', OLD.nombre_completo,
            'nombre_completo_nuevo', NEW.nombre_completo,
            'cargo_anterior', OLD.cargo,
            'cargo_nuevo', NEW.cargo,
            'correo_institucional_anterior', OLD.correo_institucional,
            'correo_institucional_nuevo', NEW.correo_institucional,
            'foto_url_anterior', OLD.foto_url,
            'foto_url_nueva', NEW.foto_url,
            'cv_url_anterior', OLD.cv_url,
            'cv_url_nueva', NEW.cv_url,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'fecha_inicio_gestion_anterior', OLD.fecha_inicio_gestion,
            'fecha_inicio_gestion_nueva', NEW.fecha_inicio_gestion,
            'fecha_fin_gestion_anterior', OLD.fecha_fin_gestion,
            'fecha_fin_gestion_nueva', NEW.fecha_fin_gestion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_autoridades_delete` AFTER DELETE ON `autoridades` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'autoridades',
        OLD.idautoridad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idautoridad', OLD.idautoridad,
            'nombre_completo', OLD.nombre_completo,
            'cargo', OLD.cargo,
            'correo_institucional', OLD.correo_institucional,
            'foto_url', OLD.foto_url,
            'cv_url', OLD.cv_url,
            'orden', OLD.orden,
            'fecha_inicio_gestion', OLD.fecha_inicio_gestion,
            'fecha_fin_gestion', OLD.fecha_fin_gestion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `idcategoria` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `idmodulo` tinyint unsigned NOT NULL,
  PRIMARY KEY (`idcategoria`),
  UNIQUE KEY `idx_categorias_modulo_slug` (`idmodulo`,`slug`),
  KEY `idx_categorias_activo` (`activo`),
  KEY `fk_categorias_modulos1_idx` (`idmodulo`),
  CONSTRAINT `fk_categorias_modulos1` FOREIGN KEY (`idmodulo`) REFERENCES `modulos` (`idmodulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_categorias_insert` AFTER INSERT ON `categorias` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'categorias',
        NEW.idcategoria,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idcategoria', NEW.idcategoria,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'orden', NEW.orden,
            'activo', NEW.activo,
            'idmodulo', NEW.idmodulo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_categorias_update` AFTER UPDATE ON `categorias` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'categorias',
        NEW.idcategoria,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo,
            'idmodulo_anterior', OLD.idmodulo,
            'idmodulo_nuevo', NEW.idmodulo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_categorias_delete` AFTER DELETE ON `categorias` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'categorias',
        OLD.idcategoria,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idcategoria', OLD.idcategoria,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'orden', OLD.orden,
            'activo', OLD.activo,
            'idmodulo', OLD.idmodulo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `iddocumento` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0',
  `es_version_actual` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_documento` date DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT NULL,
  `url_externa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iddocumento_padre` int unsigned DEFAULT NULL,
  `idarchivo` int unsigned DEFAULT NULL,
  `idcategoria` smallint unsigned NOT NULL,
  `idusuario_subidor` bigint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idtipodocumento` tinyint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`iddocumento`),
  UNIQUE KEY `idx_documentos_slug` (`slug`),
  KEY `fk_documentos_archivo_idx` (`idarchivo`),
  KEY `fk_documentos_categoria_idx` (`idcategoria`),
  KEY `fk_documentos_usuario_idx` (`idusuario_subidor`),
  KEY `fk_documentos_estado_idx` (`idestado`),
  KEY `fk_documentos_tipos_documento1_idx` (`idtipodocumento`),
  KEY `fk_documentos_documentos1_idx` (`iddocumento_padre`),
  CONSTRAINT `fk_documentos_archivo` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE RESTRICT,
  CONSTRAINT `fk_documentos_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT,
  CONSTRAINT `fk_documentos_documentos1` FOREIGN KEY (`iddocumento_padre`) REFERENCES `documentos` (`iddocumento`),
  CONSTRAINT `fk_documentos_estado` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`) ON DELETE RESTRICT,
  CONSTRAINT `fk_documentos_tipos_documento1` FOREIGN KEY (`idtipodocumento`) REFERENCES `tipos_documento` (`idtipodocumento`),
  CONSTRAINT `fk_documentos_usuario` FOREIGN KEY (`idusuario_subidor`) REFERENCES `usuarios` (`idusuario`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_documentos_insert` AFTER INSERT ON `documentos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'documentos',
        NEW.iddocumento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'iddocumento', NEW.iddocumento,
            'titulo', NEW.titulo,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'version', NEW.version,
            'es_version_actual', NEW.es_version_actual,
            'fecha_documento', NEW.fecha_documento,
            'fecha_publicacion', NEW.fecha_publicacion,
            'url_externa', NEW.url_externa,
            'iddocumento_padre', NEW.iddocumento_padre,
            'idarchivo', NEW.idarchivo,
            'idcategoria', NEW.idcategoria,
            'idusuario_subidor', NEW.idusuario_subidor,
            'idestado', NEW.idestado,
            'idtipodocumento', NEW.idtipodocumento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_documentos_update` AFTER UPDATE ON `documentos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'documentos',
        NEW.iddocumento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'version_anterior', OLD.version,
            'version_nueva', NEW.version,
            'es_version_actual_anterior', OLD.es_version_actual,
            'es_version_actual_nueva', NEW.es_version_actual,
            'fecha_documento_anterior', OLD.fecha_documento,
            'fecha_documento_nueva', NEW.fecha_documento,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'url_externa_anterior', OLD.url_externa,
            'url_externa_nueva', NEW.url_externa,
            'iddocumento_padre_anterior', OLD.iddocumento_padre,
            'iddocumento_padre_nuevo', NEW.iddocumento_padre,
            'idarchivo_anterior', OLD.idarchivo,
            'idarchivo_nuevo', NEW.idarchivo,
            'idcategoria_anterior', OLD.idcategoria,
            'idcategoria_nueva', NEW.idcategoria,
            'idestado_anterior', OLD.idestado,
            'idestado_nuevo', NEW.idestado,
            'idtipodocumento_anterior', OLD.idtipodocumento,
            'idtipodocumento_nuevo', NEW.idtipodocumento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_documentos_delete` AFTER DELETE ON `documentos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'documentos',
        OLD.iddocumento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'iddocumento', OLD.iddocumento,
            'titulo', OLD.titulo,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'version', OLD.version,
            'es_version_actual', OLD.es_version_actual,
            'fecha_documento', OLD.fecha_documento,
            'fecha_publicacion', OLD.fecha_publicacion,
            'url_externa', OLD.url_externa,
            'iddocumento_padre', OLD.iddocumento_padre,
            'idarchivo', OLD.idarchivo,
            'idcategoria', OLD.idcategoria,
            'idusuario_subidor', OLD.idusuario_subidor,
            'idestado', OLD.idestado,
            'idtipodocumento', OLD.idtipodocumento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `enlaces_sistemas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enlaces_sistemas` (
  `idenlace` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_sistema` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icono` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT NULL,
  `idcategoria` smallint unsigned NOT NULL,
  `idestadooperativo` tinyint unsigned NOT NULL,
  `idarchivo_manual` int unsigned DEFAULT NULL,
  `idarchivo_documentacion` int unsigned DEFAULT NULL,
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idenlace`),
  UNIQUE KEY `idx_enlaces_slug` (`slug`),
  KEY `fk_enlaces_categoria_idx` (`idcategoria`),
  KEY `idx_enlaces_activo` (`activo`),
  KEY `fk_enlaces_sistemas_estados_operativos1_idx` (`idestadooperativo`),
  KEY `fk_enlaces_sistemas_archivo_manual` (`idarchivo_manual`),
  KEY `fk_enlaces_sistemas_archivo_documentacion` (`idarchivo_documentacion`),
  CONSTRAINT `fk_enlaces_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT,
  CONSTRAINT `fk_enlaces_sistemas_archivo_documentacion` FOREIGN KEY (`idarchivo_documentacion`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL,
  CONSTRAINT `fk_enlaces_sistemas_archivo_manual` FOREIGN KEY (`idarchivo_manual`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL,
  CONSTRAINT `fk_enlaces_sistemas_estados_operativos1` FOREIGN KEY (`idestadooperativo`) REFERENCES `estados_operativos` (`idestadooperativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_enlaces_sistemas_insert` AFTER INSERT ON `enlaces_sistemas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'enlaces_sistemas',
        NEW.idenlace,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idenlace', NEW.idenlace,
            'nombre_sistema', NEW.nombre_sistema,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'url', NEW.url,
            'icono', NEW.icono,
            'fecha_publicacion', NEW.fecha_publicacion,
            'idcategoria', NEW.idcategoria,
            'idestadooperativo', NEW.idestadooperativo,
            'orden', NEW.orden,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_enlaces_sistemas_update` AFTER UPDATE ON `enlaces_sistemas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'enlaces_sistemas',
        NEW.idenlace,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_sistema_anterior', OLD.nombre_sistema,
            'nombre_sistema_nuevo', NEW.nombre_sistema,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'url_anterior', OLD.url,
            'url_nueva', NEW.url,
            'icono_anterior', OLD.icono,
            'icono_nuevo', NEW.icono,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'idcategoria_anterior', OLD.idcategoria,
            'idcategoria_nueva', NEW.idcategoria,
            'idestadooperativo_anterior', OLD.idestadooperativo,
            'idestadooperativo_nuevo', NEW.idestadooperativo,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_enlaces_sistemas_delete` AFTER DELETE ON `enlaces_sistemas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'enlaces_sistemas',
        OLD.idenlace,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idenlace', OLD.idenlace,
            'nombre_sistema', OLD.nombre_sistema,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'url', OLD.url,
            'icono', OLD.icono,
            'fecha_publicacion', OLD.fecha_publicacion,
            'idcategoria', OLD.idcategoria,
            'idestadooperativo', OLD.idestadooperativo,
            'orden', OLD.orden,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados` (
  `idestado` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idtipoentidad` tinyint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idestado`),
  UNIQUE KEY `idx_estados_entidad_slug` (`idtipoentidad`,`slug`),
  KEY `fk_estados_tipos_entidad1_idx` (`idtipoentidad`),
  CONSTRAINT `fk_estados_tipos_entidad1` FOREIGN KEY (`idtipoentidad`) REFERENCES `tipos_entidad` (`idtipoentidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estados_insert` AFTER INSERT ON `estados` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'estados',
        NEW.idestado,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idestado', NEW.idestado,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'idtipoentidad', NEW.idtipoentidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estados_update` AFTER UPDATE ON `estados` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'estados',
        NEW.idestado,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'idtipoentidad_anterior', OLD.idtipoentidad,
            'idtipoentidad_nuevo', NEW.idtipoentidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estados_delete` AFTER DELETE ON `estados` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'estados',
        OLD.idestado,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idestado', OLD.idestado,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'idtipoentidad', OLD.idtipoentidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `estados_operativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados_operativos` (
  `idestadooperativo` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idestadooperativo`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estados_operativos_insert` AFTER INSERT ON `estados_operativos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'estados_operativos',
        NEW.idestadooperativo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idestadooperativo', NEW.idestadooperativo,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estados_operativos_update` AFTER UPDATE ON `estados_operativos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'estados_operativos',
        NEW.idestadooperativo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estados_operativos_delete` AFTER DELETE ON `estados_operativos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'estados_operativos',
        OLD.idestadooperativo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idestadooperativo', OLD.idestadooperativo,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `etiquetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etiquetas` (
  `idetiqueta` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idetiqueta`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_etiquetas_insert` AFTER INSERT ON `etiquetas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'etiquetas',
        NEW.idetiqueta,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idetiqueta', NEW.idetiqueta,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'color', NEW.color,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_etiquetas_update` AFTER UPDATE ON `etiquetas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'etiquetas',
        NEW.idetiqueta,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'color_anterior', OLD.color,
            'color_nuevo', NEW.color,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_etiquetas_delete` AFTER DELETE ON `etiquetas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'etiquetas',
        OLD.idetiqueta,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idetiqueta', OLD.idetiqueta,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'color', OLD.color,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `etiquetas_contenido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etiquetas_contenido` (
  `idetiqueta` smallint unsigned NOT NULL,
  `entidad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identidad` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idetiqueta`,`entidad`,`identidad`),
  KEY `fk_etiquetas_contenido_etiquetas1_idx` (`idetiqueta`),
  KEY `idx_etiquetas_busqueda` (`entidad`,`identidad`),
  CONSTRAINT `fk_etiquetas_contenido_etiquetas1` FOREIGN KEY (`idetiqueta`) REFERENCES `etiquetas` (`idetiqueta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_etiquetas_contenido_insert` AFTER INSERT ON `etiquetas_contenido` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'asignar_etiqueta',
        'etiquetas_contenido',
        NEW.identidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idetiqueta', NEW.idetiqueta,
            'entidad', NEW.entidad,
            'identidad', NEW.identidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_etiquetas_contenido_update` AFTER UPDATE ON `etiquetas_contenido` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar_etiqueta_contenido',
        'etiquetas_contenido',
        NEW.identidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idetiqueta_anterior', OLD.idetiqueta,
            'idetiqueta_nueva', NEW.idetiqueta,
            'entidad_anterior', OLD.entidad,
            'entidad_nueva', NEW.entidad,
            'identidad_anterior', OLD.identidad,
            'identidad_nueva', NEW.identidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_etiquetas_contenido_delete` AFTER DELETE ON `etiquetas_contenido` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'quitar_etiqueta',
        'etiquetas_contenido',
        OLD.identidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idetiqueta', OLD.idetiqueta,
            'entidad', OLD.entidad,
            'identidad', OLD.identidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `idevento` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ubicacion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enlace_virtual` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cupo_maximo` smallint unsigned DEFAULT NULL,
  `cupos_ocupados` smallint unsigned NOT NULL DEFAULT '0',
  `fecha_publicacion` datetime DEFAULT NULL,
  `idarchivo` int unsigned DEFAULT NULL,
  `idcategoria` smallint unsigned NOT NULL,
  `idusuario_organizador` bigint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idtipoevento` tinyint unsigned NOT NULL,
  `idmodalidad` tinyint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idevento`),
  UNIQUE KEY `idx_eventos_slug` (`slug`),
  KEY `idx_eventos_fecha_inicio` (`fecha_inicio`),
  KEY `fk_eventos_categoria_idx` (`idcategoria`),
  KEY `fk_eventos_organizador_idx` (`idusuario_organizador`),
  KEY `fk_eventos_estado_idx` (`idestado`),
  KEY `fk_eventos_tipos_evento1_idx` (`idtipoevento`),
  KEY `fk_eventos_modalidades_evento1_idx` (`idmodalidad`),
  KEY `fk_eventos_archivos1_idx` (`idarchivo`),
  CONSTRAINT `fk_eventos_archivos1` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_eventos_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT,
  CONSTRAINT `fk_eventos_estado` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`) ON DELETE RESTRICT,
  CONSTRAINT `fk_eventos_modalidades_evento1` FOREIGN KEY (`idmodalidad`) REFERENCES `modalidades_evento` (`idmodalidad`),
  CONSTRAINT `fk_eventos_organizador` FOREIGN KEY (`idusuario_organizador`) REFERENCES `usuarios` (`idusuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_eventos_tipos_evento1` FOREIGN KEY (`idtipoevento`) REFERENCES `tipos_evento` (`idtipoevento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_insert` AFTER INSERT ON `eventos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'eventos',
        NEW.idevento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idevento', NEW.idevento,
            'titulo', NEW.titulo,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'fecha_inicio', NEW.fecha_inicio,
            'fecha_fin', NEW.fecha_fin,
            'ubicacion', NEW.ubicacion,
            'enlace_virtual', NEW.enlace_virtual,
            'cupo_maximo', NEW.cupo_maximo,
            'cupos_ocupados', NEW.cupos_ocupados,
            'fecha_publicacion', NEW.fecha_publicacion,
            'idarchivo', NEW.idarchivo,
            'idcategoria', NEW.idcategoria,
            'idusuario_organizador', NEW.idusuario_organizador,
            'idestado', NEW.idestado,
            'idtipoevento', NEW.idtipoevento,
            'idmodalidad', NEW.idmodalidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_update` AFTER UPDATE ON `eventos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'eventos',
        NEW.idevento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'fecha_inicio_anterior', OLD.fecha_inicio,
            'fecha_inicio_nueva', NEW.fecha_inicio,
            'fecha_fin_anterior', OLD.fecha_fin,
            'fecha_fin_nueva', NEW.fecha_fin,
            'ubicacion_anterior', OLD.ubicacion,
            'ubicacion_nueva', NEW.ubicacion,
            'enlace_virtual_anterior', OLD.enlace_virtual,
            'enlace_virtual_nuevo', NEW.enlace_virtual,
            'cupo_maximo_anterior', OLD.cupo_maximo,
            'cupo_maximo_nuevo', NEW.cupo_maximo,
            'cupos_ocupados_anterior', OLD.cupos_ocupados,
            'cupos_ocupados_nuevo', NEW.cupos_ocupados,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'idarchivo_anterior', OLD.idarchivo,
            'idarchivo_nuevo', NEW.idarchivo,
            'idcategoria_anterior', OLD.idcategoria,
            'idcategoria_nueva', NEW.idcategoria,
            'idestado_anterior', OLD.idestado,
            'idestado_nuevo', NEW.idestado,
            'idtipoevento_anterior', OLD.idtipoevento,
            'idtipoevento_nuevo', NEW.idtipoevento,
            'idmodalidad_anterior', OLD.idmodalidad,
            'idmodalidad_nueva', NEW.idmodalidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_delete` AFTER DELETE ON `eventos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'eventos',
        OLD.idevento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idevento', OLD.idevento,
            'titulo', OLD.titulo,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'fecha_inicio', OLD.fecha_inicio,
            'fecha_fin', OLD.fecha_fin,
            'ubicacion', OLD.ubicacion,
            'enlace_virtual', OLD.enlace_virtual,
            'cupo_maximo', OLD.cupo_maximo,
            'cupos_ocupados', OLD.cupos_ocupados,
            'fecha_publicacion', OLD.fecha_publicacion,
            'idarchivo', OLD.idarchivo,
            'idcategoria', OLD.idcategoria,
            'idusuario_organizador', OLD.idusuario_organizador,
            'idestado', OLD.idestado,
            'idtipoevento', OLD.idtipoevento,
            'idmodalidad', OLD.idmodalidad
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `eventos_archivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_archivos` (
  `ideventoarchivo` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'imagen, pdf, documento, afiche, recurso',
  `es_portada` tinyint(1) NOT NULL DEFAULT '0',
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `idarchivo` int unsigned NOT NULL,
  `idevento` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ideventoarchivo`),
  KEY `idx_eventos_archivos_evento` (`idevento`),
  KEY `idx_eventos_archivos_archivo` (`idarchivo`),
  KEY `idx_eventos_archivos_portada` (`es_portada`),
  KEY `idx_eventos_archivos_orden` (`orden`),
  CONSTRAINT `fk_eventos_archivos_archivo` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_eventos_archivos_evento` FOREIGN KEY (`idevento`) REFERENCES `eventos` (`idevento`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_archivos_insert` AFTER INSERT ON `eventos_archivos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'subir_archivo',
        'eventos_archivos',
        NEW.ideventoarchivo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'ideventoarchivo', NEW.ideventoarchivo,
            'titulo', NEW.titulo,
            'descripcion', NEW.descripcion,
            'tipo', NEW.tipo,
            'es_portada', NEW.es_portada,
            'orden', NEW.orden,
            'idarchivo', NEW.idarchivo,
            'idevento', NEW.idevento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_archivos_update` AFTER UPDATE ON `eventos_archivos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'eventos_archivos',
        NEW.ideventoarchivo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'tipo_anterior', OLD.tipo,
            'tipo_nuevo', NEW.tipo,
            'es_portada_anterior', OLD.es_portada,
            'es_portada_nueva', NEW.es_portada,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'idarchivo_anterior', OLD.idarchivo,
            'idarchivo_nuevo', NEW.idarchivo,
            'idevento_anterior', OLD.idevento,
            'idevento_nuevo', NEW.idevento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_archivos_delete` AFTER DELETE ON `eventos_archivos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar_archivo',
        'eventos_archivos',
        OLD.ideventoarchivo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'ideventoarchivo', OLD.ideventoarchivo,
            'titulo', OLD.titulo,
            'descripcion', OLD.descripcion,
            'tipo', OLD.tipo,
            'es_portada', OLD.es_portada,
            'orden', OLD.orden,
            'idarchivo', OLD.idarchivo,
            'idevento', OLD.idevento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `eventos_inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_inscripciones` (
  `idevento_inscripcion` int unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dependencia` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idusuario` bigint unsigned DEFAULT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idevento` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idevento_inscripcion`),
  UNIQUE KEY `idx_evento_email_unique` (`idevento`,`email`),
  KEY `fk_eventos_inscripciones_eventos1_idx` (`idevento`),
  KEY `fk_eventos_inscripciones_estados1_idx` (`idestado`),
  KEY `fk_eventos_inscripciones_usuarios1_idx` (`idusuario`),
  CONSTRAINT `fk_eventos_inscripciones_estados1` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`),
  CONSTRAINT `fk_eventos_inscripciones_eventos1` FOREIGN KEY (`idevento`) REFERENCES `eventos` (`idevento`),
  CONSTRAINT `fk_eventos_inscripciones_usuarios1` FOREIGN KEY (`idusuario`) REFERENCES `usuarios` (`idusuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_inscripciones_insert` AFTER INSERT ON `eventos_inscripciones` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'inscribir',
        'eventos_inscripciones',
        NEW.idevento_inscripcion,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idevento_inscripcion', NEW.idevento_inscripcion,
            'nombres', NEW.nombres,
            'email', NEW.email,
            'telefono', NEW.telefono,
            'dependencia', NEW.dependencia,
            'idusuario', NEW.idusuario,
            'idestado', NEW.idestado,
            'idevento', NEW.idevento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_inscripciones_update` AFTER UPDATE ON `eventos_inscripciones` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'eventos_inscripciones',
        NEW.idevento_inscripcion,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombres_anterior', OLD.nombres,
            'nombres_nuevo', NEW.nombres,
            'email_anterior', OLD.email,
            'email_nuevo', NEW.email,
            'telefono_anterior', OLD.telefono,
            'telefono_nuevo', NEW.telefono,
            'dependencia_anterior', OLD.dependencia,
            'dependencia_nueva', NEW.dependencia,
            'idusuario_anterior', OLD.idusuario,
            'idusuario_nuevo', NEW.idusuario,
            'idestado_anterior', OLD.idestado,
            'idestado_nuevo', NEW.idestado,
            'idevento_anterior', OLD.idevento,
            'idevento_nuevo', NEW.idevento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_eventos_inscripciones_delete` AFTER DELETE ON `eventos_inscripciones` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'eventos_inscripciones',
        OLD.idevento_inscripcion,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idevento_inscripcion', OLD.idevento_inscripcion,
            'nombres', OLD.nombres,
            'email', OLD.email,
            'telefono', OLD.telefono,
            'dependencia', OLD.dependencia,
            'idusuario', OLD.idusuario,
            'idestado', OLD.idestado,
            'idevento', OLD.idevento
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `idfaq` int unsigned NOT NULL AUTO_INCREMENT,
  `pregunta` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `respuesta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` smallint unsigned NOT NULL DEFAULT '0',
  `veces_util` int unsigned NOT NULL DEFAULT '0',
  `fecha_publicacion` datetime DEFAULT NULL,
  `idcategoria` smallint unsigned NOT NULL,
  `idusuario_autor` bigint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idfaq`),
  KEY `idx_faqs_orden` (`orden`),
  KEY `fk_faqs_categoria_idx` (`idcategoria`),
  KEY `fk_faqs_autor_idx` (`idusuario_autor`),
  KEY `fk_faqs_estado_idx` (`idestado`),
  CONSTRAINT `fk_faqs_autor` FOREIGN KEY (`idusuario_autor`) REFERENCES `usuarios` (`idusuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_faqs_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT,
  CONSTRAINT `fk_faqs_estado` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_faqs_insert` AFTER INSERT ON `faqs` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'faqs',
        NEW.idfaq,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idfaq', NEW.idfaq,
            'pregunta', NEW.pregunta,
            'orden', NEW.orden,
            'veces_util', NEW.veces_util,
            'fecha_publicacion', NEW.fecha_publicacion,
            'idcategoria', NEW.idcategoria,
            'idusuario_autor', NEW.idusuario_autor,
            'idestado', NEW.idestado
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_faqs_update` AFTER UPDATE ON `faqs` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'faqs',
        NEW.idfaq,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'pregunta_anterior', OLD.pregunta,
            'pregunta_nueva', NEW.pregunta,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'veces_util_anterior', OLD.veces_util,
            'veces_util_nuevo', NEW.veces_util,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'idcategoria_anterior', OLD.idcategoria,
            'idcategoria_nueva', NEW.idcategoria,
            'idestado_anterior', OLD.idestado,
            'idestado_nuevo', NEW.idestado
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_faqs_delete` AFTER DELETE ON `faqs` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'faqs',
        OLD.idfaq,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idfaq', OLD.idfaq,
            'pregunta', OLD.pregunta,
            'orden', OLD.orden,
            'veces_util', OLD.veces_util,
            'fecha_publicacion', OLD.fecha_publicacion,
            'idcategoria', OLD.idcategoria,
            'idusuario_autor', OLD.idusuario_autor,
            'idestado', OLD.idestado
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `info_institucional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `info_institucional` (
  `idinfo` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` tinyint unsigned NOT NULL,
  `activo` tinyint unsigned NOT NULL DEFAULT '1',
  `idusuario_editor` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idinfo`),
  UNIQUE KEY `clave_UNIQUE` (`clave`),
  KEY `fk_info_institucional_usuario_idx` (`idusuario_editor`),
  CONSTRAINT `fk_info_institucional_usuario` FOREIGN KEY (`idusuario_editor`) REFERENCES `usuarios` (`idusuario`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_info_institucional_insert` AFTER INSERT ON `info_institucional` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'info_institucional',
        NEW.idinfo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idinfo', NEW.idinfo,
            'clave', NEW.clave,
            'titulo', NEW.titulo,
            'orden', NEW.orden,
            'activo', NEW.activo,
            'idusuario_editor', NEW.idusuario_editor
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_info_institucional_update` AFTER UPDATE ON `info_institucional` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'info_institucional',
        NEW.idinfo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'clave_anterior', OLD.clave,
            'clave_nueva', NEW.clave,
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo,
            'idusuario_editor_anterior', OLD.idusuario_editor,
            'idusuario_editor_nuevo', NEW.idusuario_editor
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_info_institucional_delete` AFTER DELETE ON `info_institucional` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'info_institucional',
        OLD.idinfo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idinfo', OLD.idinfo,
            'clave', OLD.clave,
            'titulo', OLD.titulo,
            'orden', OLD.orden,
            'activo', OLD.activo,
            'idusuario_editor', OLD.idusuario_editor
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `logs_actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs_actividad` (
  `idlog` bigint unsigned NOT NULL AUTO_INCREMENT,
  `idusuario` bigint unsigned DEFAULT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entidad` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identificador_entidad` bigint unsigned DEFAULT NULL,
  `ip_origen` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `detalles` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idlog`),
  KEY `idx_logs_usuario` (`idusuario`),
  KEY `idx_logs_entidad` (`entidad`),
  KEY `idx_logs_created_at` (`created_at`),
  KEY `idx_logs_entidad_id` (`entidad`,`identificador_entidad`) /*!80000 INVISIBLE */,
  CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`idusuario`) REFERENCES `usuarios` (`idusuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `modalidades_evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modalidades_evento` (
  `idmodalidad` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idmodalidad`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_modalidades_evento_insert` AFTER INSERT ON `modalidades_evento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'modalidades_evento',
        NEW.idmodalidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idmodalidad', NEW.idmodalidad,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_modalidades_evento_update` AFTER UPDATE ON `modalidades_evento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'modalidades_evento',
        NEW.idmodalidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_modalidades_evento_delete` AFTER DELETE ON `modalidades_evento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'modalidades_evento',
        OLD.idmodalidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idmodalidad', OLD.idmodalidad,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `modulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modulos` (
  `idmodulo` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idmodulo`),
  UNIQUE KEY `slug_UNIQUE` (`slug`),
  UNIQUE KEY `nombre_UNIQUE` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_modulos_insert` AFTER INSERT ON `modulos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'modulos',
        NEW.idmodulo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idmodulo', NEW.idmodulo,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_modulos_update` AFTER UPDATE ON `modulos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'modulos',
        NEW.idmodulo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_modulos_delete` AFTER DELETE ON `modulos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'modulos',
        OLD.idmodulo,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idmodulo', OLD.idmodulo,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `noticias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `noticias` (
  `idnoticia` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resumen` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_destacada` tinyint(1) NOT NULL DEFAULT '0',
  `visitas` int unsigned NOT NULL DEFAULT '0',
  `idcategoria` smallint unsigned NOT NULL,
  `idusuario_autor` bigint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idtipopublicacion` tinyint unsigned NOT NULL,
  `fecha_publicacion` datetime DEFAULT NULL,
  `fecha_expiracion` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idnoticia`),
  UNIQUE KEY `idx_noticias_slug` (`slug`),
  KEY `idx_noticias_fecha_publicacion` (`fecha_publicacion`),
  KEY `idx_noticias_destacada` (`es_destacada`),
  KEY `fk_noticias_categoria_idx` (`idcategoria`),
  KEY `fk_noticias_autor_idx` (`idusuario_autor`),
  KEY `fk_noticias_estado_idx` (`idestado`),
  KEY `fk_noticias_tipos_publicacion1_idx` (`idtipopublicacion`),
  CONSTRAINT `fk_noticias_autor` FOREIGN KEY (`idusuario_autor`) REFERENCES `usuarios` (`idusuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_noticias_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT,
  CONSTRAINT `fk_noticias_estado` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`) ON DELETE RESTRICT,
  CONSTRAINT `fk_noticias_tipos_publicacion1` FOREIGN KEY (`idtipopublicacion`) REFERENCES `tipos_publicacion` (`idtipopublicacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_noticias_insert` AFTER INSERT ON `noticias` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'noticias',
        NEW.idnoticia,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'slug', NEW.slug,
            'resumen', NEW.resumen,
            'es_destacada', NEW.es_destacada,
            'idcategoria', NEW.idcategoria,
            'idestado', NEW.idestado,
            'idtipopublicacion', NEW.idtipopublicacion,
            'fecha_publicacion', NEW.fecha_publicacion,
            'fecha_expiracion', NEW.fecha_expiracion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_noticias_update` AFTER UPDATE ON `noticias` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'noticias',
        NEW.idnoticia,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'estado_anterior', OLD.idestado,
            'estado_nuevo', NEW.idestado,
            'categoria_anterior', OLD.idcategoria,
            'categoria_nueva', NEW.idcategoria,
            'destacada_anterior', OLD.es_destacada,
            'destacada_nueva', NEW.es_destacada,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'fecha_expiracion_anterior', OLD.fecha_expiracion,
            'fecha_expiracion_nueva', NEW.fecha_expiracion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_noticias_delete` AFTER DELETE ON `noticias` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'noticias',
        OLD.idnoticia,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'slug', OLD.slug,
            'resumen', OLD.resumen,
            'es_destacada', OLD.es_destacada,
            'idcategoria', OLD.idcategoria,
            'idestado', OLD.idestado,
            'idtipopublicacion', OLD.idtipopublicacion,
            'fecha_publicacion', OLD.fecha_publicacion,
            'fecha_expiracion', OLD.fecha_expiracion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `noticias_imagen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `noticias_imagen` (
  `idnoticiaimagen` int unsigned NOT NULL AUTO_INCREMENT,
  `texto_alternativo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_portada` tinyint(1) NOT NULL,
  `orden` tinyint NOT NULL,
  `idarchivo` int unsigned NOT NULL,
  `idnoticia` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idnoticiaimagen`),
  KEY `fk_noticias_imagen_archivos1_idx` (`idarchivo`),
  KEY `fk_noticias_imagen_noticias1_idx` (`idnoticia`),
  CONSTRAINT `fk_noticias_imagen_archivos1` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`),
  CONSTRAINT `fk_noticias_imagen_noticias1` FOREIGN KEY (`idnoticia`) REFERENCES `noticias` (`idnoticia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_noticias_imagen_insert` AFTER INSERT ON `noticias_imagen` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'subir_archivo',
        'noticias_imagen',
        NEW.idnoticiaimagen,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idnoticiaimagen', NEW.idnoticiaimagen,
            'idnoticia', NEW.idnoticia,
            'idarchivo', NEW.idarchivo,
            'texto_alternativo', NEW.texto_alternativo,
            'descripcion', NEW.descripcion,
            'es_portada', NEW.es_portada,
            'orden', NEW.orden
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_noticias_imagen_update` AFTER UPDATE ON `noticias_imagen` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'noticias_imagen',
        NEW.idnoticiaimagen,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idnoticia', NEW.idnoticia,
            'idarchivo_anterior', OLD.idarchivo,
            'idarchivo_nuevo', NEW.idarchivo,
            'texto_alternativo_anterior', OLD.texto_alternativo,
            'texto_alternativo_nuevo', NEW.texto_alternativo,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'es_portada_anterior', OLD.es_portada,
            'es_portada_nueva', NEW.es_portada,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_noticias_imagen_delete` AFTER DELETE ON `noticias_imagen` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar_archivo',
        'noticias_imagen',
        OLD.idnoticiaimagen,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idnoticiaimagen', OLD.idnoticiaimagen,
            'idnoticia', OLD.idnoticia,
            'idarchivo', OLD.idarchivo,
            'texto_alternativo', OLD.texto_alternativo,
            'descripcion', OLD.descripcion,
            'es_portada', OLD.es_portada,
            'orden', OLD.orden
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `idpermiso` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(105) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idmodulo` tinyint unsigned NOT NULL,
  PRIMARY KEY (`idpermiso`),
  UNIQUE KEY `nombre_UNIQUE` (`nombre`),
  KEY `fk_permisos_modulos1_idx` (`idmodulo`),
  CONSTRAINT `fk_permisos_modulos1` FOREIGN KEY (`idmodulo`) REFERENCES `modulos` (`idmodulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_permisos_insert` AFTER INSERT ON `permisos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'permisos',
        NEW.idpermiso,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idpermiso', NEW.idpermiso,
            'nombre', NEW.nombre,
            'descripcion', NEW.descripcion,
            'idmodulo', NEW.idmodulo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_permisos_update` AFTER UPDATE ON `permisos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'permisos',
        NEW.idpermiso,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'idmodulo_anterior', OLD.idmodulo,
            'idmodulo_nuevo', NEW.idmodulo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_permisos_delete` AFTER DELETE ON `permisos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'permisos',
        OLD.idpermiso,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idpermiso', OLD.idpermiso,
            'nombre', OLD.nombre,
            'descripcion', OLD.descripcion,
            'idmodulo', OLD.idmodulo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `portal_configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portal_configuracion` (
  `idconfig` smallint unsigned NOT NULL AUTO_INCREMENT,
  `clave` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador único. Ej: color_primario',
  `valor` text COLLATE utf8mb4_unicode_ci COMMENT 'Valor de la configuración',
  `idarchivo` int unsigned DEFAULT NULL,
  `tipo` enum('texto','color','booleano','json','url','email','numero','archivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'texto',
  `grupo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'apariencia | textos | modulos | servicios | noticias | soporte | smtp | avanzado',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idconfig`),
  UNIQUE KEY `uq_portal_configuracion_clave` (`clave`),
  KEY `idx_portal_configuracion_grupo` (`grupo`),
  KEY `idx_portal_configuracion_archivo` (`idarchivo`),
  CONSTRAINT `fk_portal_configuracion_archivo` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración global del portal. Una fila por clave.';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `prioridades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prioridades` (
  `idprioridad` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel` tinyint unsigned NOT NULL COMMENT '1: baja, 2: media, 3: alta, 4: crítica',
  `dias_respuesta_max` tinyint unsigned NOT NULL DEFAULT '3',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idprioridad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_prioridades_insert` AFTER INSERT ON `prioridades` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'prioridades',
        NEW.idprioridad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idprioridad', NEW.idprioridad,
            'nombre', NEW.nombre,
            'nivel', NEW.nivel,
            'dias_respuesta_max', NEW.dias_respuesta_max,
            'descripcion', NEW.descripcion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_prioridades_update` AFTER UPDATE ON `prioridades` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'prioridades',
        NEW.idprioridad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'nivel_anterior', OLD.nivel,
            'nivel_nuevo', NEW.nivel,
            'dias_respuesta_max_anterior', OLD.dias_respuesta_max,
            'dias_respuesta_max_nuevo', NEW.dias_respuesta_max,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_prioridades_delete` AFTER DELETE ON `prioridades` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'prioridades',
        OLD.idprioridad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idprioridad', OLD.idprioridad,
            'nombre', OLD.nombre,
            'nivel', OLD.nivel,
            'dias_respuesta_max', OLD.dias_respuesta_max,
            'descripcion', OLD.descripcion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `proyectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proyectos` (
  `idproyecto` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `porcentaje_avance` tinyint unsigned NOT NULL DEFAULT '0',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `responsable` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_resultado` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idcategoria` smallint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idarchivo` int unsigned DEFAULT NULL,
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idproyecto`),
  UNIQUE KEY `slug_UNIQUE` (`slug`),
  KEY `fk_proyectos_categorias1_idx` (`idcategoria`),
  KEY `fk_proyectos_estados1_idx` (`idestado`),
  KEY `fk_proyectos_archivos1_idx` (`idarchivo`),
  CONSTRAINT `fk_proyectos_archivos1` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proyectos_categorias1` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`),
  CONSTRAINT `fk_proyectos_estados1` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_proyectos_insert` AFTER INSERT ON `proyectos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'proyectos',
        NEW.idproyecto,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'slug', NEW.slug,
            'porcentaje_avance', NEW.porcentaje_avance,
            'responsable', NEW.responsable,
            'idcategoria', NEW.idcategoria,
            'idestado', NEW.idestado
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_proyectos_update` AFTER UPDATE ON `proyectos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'proyectos',
        NEW.idproyecto,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'avance_anterior', OLD.porcentaje_avance,
            'avance_nuevo', NEW.porcentaje_avance,
            'estado_anterior', OLD.idestado,
            'estado_nuevo', NEW.idestado,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_proyectos_delete` AFTER DELETE ON `proyectos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'proyectos',
        OLD.idproyecto,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'slug', OLD.slug,
            'porcentaje_avance', OLD.porcentaje_avance,
            'responsable', OLD.responsable,
            'idcategoria', OLD.idcategoria,
            'idestado', OLD.idestado
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `idrol` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idrol`),
  UNIQUE KEY `idx_roles_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_roles_insert` AFTER INSERT ON `roles` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'roles',
        NEW.idrol,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idrol', NEW.idrol,
            'nombre', NEW.nombre,
            'descripcion', NEW.descripcion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_roles_update` AFTER UPDATE ON `roles` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'roles',
        NEW.idrol,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_roles_delete` AFTER DELETE ON `roles` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'roles',
        OLD.idrol,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idrol', OLD.idrol,
            'nombre', OLD.nombre,
            'descripcion', OLD.descripcion
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `roles_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles_permisos` (
  `idrol` tinyint unsigned NOT NULL,
  `idpermiso` int unsigned NOT NULL,
  PRIMARY KEY (`idrol`,`idpermiso`),
  KEY `fk_roles_has_permisos_permisos1_idx` (`idpermiso`),
  KEY `fk_roles_has_permisos_roles1_idx` (`idrol`),
  CONSTRAINT `fk_roles_has_permisos_permisos1` FOREIGN KEY (`idpermiso`) REFERENCES `permisos` (`idpermiso`),
  CONSTRAINT `fk_roles_has_permisos_roles1` FOREIGN KEY (`idrol`) REFERENCES `roles` (`idrol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_roles_permisos_insert` AFTER INSERT ON `roles_permisos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'asignar_permiso',
        'roles_permisos',
        NEW.idrol,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idrol', NEW.idrol,
            'idpermiso', NEW.idpermiso
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_roles_permisos_update` AFTER UPDATE ON `roles_permisos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar_permiso_rol',
        'roles_permisos',
        NEW.idrol,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idrol_anterior', OLD.idrol,
            'idrol_nuevo', NEW.idrol,
            'idpermiso_anterior', OLD.idpermiso,
            'idpermiso_nuevo', NEW.idpermiso
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_roles_permisos_delete` AFTER DELETE ON `roles_permisos` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'quitar_permiso',
        'roles_permisos',
        OLD.idrol,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idrol', OLD.idrol,
            'idpermiso', OLD.idpermiso
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `idservicio` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion_corta` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion_larga` text COLLATE utf8mb4_unicode_ci,
  `correo_contacto` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `texto_accion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orientacion` text COLLATE utf8mb4_unicode_ci,
  `casos_uso` text COLLATE utf8mb4_unicode_ci,
  `consejo` text COLLATE utf8mb4_unicode_ci,
  `seccion_relacionada` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label_seccion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icono` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_servicio` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiere_autenticacion` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_publicacion` datetime DEFAULT NULL,
  `idcategoria` smallint unsigned NOT NULL,
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idservicio`),
  UNIQUE KEY `idx_servicios_slug` (`slug`),
  KEY `fk_servicios_categoria_idx` (`idcategoria`),
  CONSTRAINT `fk_servicios_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_servicios_insert` AFTER INSERT ON `servicios` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'servicios',
        NEW.idservicio,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idservicio', NEW.idservicio,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion_corta', NEW.descripcion_corta,
            'descripcion_larga', NEW.descripcion_larga,
            'icono', NEW.icono,
            'url_servicio', NEW.url_servicio,
            'requiere_autenticacion', NEW.requiere_autenticacion,
            'fecha_publicacion', NEW.fecha_publicacion,
            'idcategoria', NEW.idcategoria,
            'orden', NEW.orden,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_servicios_update` AFTER UPDATE ON `servicios` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'servicios',
        NEW.idservicio,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_corta_anterior', OLD.descripcion_corta,
            'descripcion_corta_nueva', NEW.descripcion_corta,
            'url_servicio_anterior', OLD.url_servicio,
            'url_servicio_nueva', NEW.url_servicio,
            'requiere_autenticacion_anterior', OLD.requiere_autenticacion,
            'requiere_autenticacion_nueva', NEW.requiere_autenticacion,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'idcategoria_anterior', OLD.idcategoria,
            'idcategoria_nueva', NEW.idcategoria,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_servicios_delete` AFTER DELETE ON `servicios` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'servicios',
        OLD.idservicio,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idservicio', OLD.idservicio,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion_corta', OLD.descripcion_corta,
            'descripcion_larga', OLD.descripcion_larga,
            'icono', OLD.icono,
            'url_servicio', OLD.url_servicio,
            'requiere_autenticacion', OLD.requiere_autenticacion,
            'fecha_publicacion', OLD.fecha_publicacion,
            'idcategoria', OLD.idcategoria,
            'orden', OLD.orden,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `solicitudes_respuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_respuestas` (
  `idsolicitud_respuesta` int unsigned NOT NULL AUTO_INCREMENT,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_interno` tinyint(1) NOT NULL DEFAULT '0',
  `idsolicitud` int unsigned NOT NULL,
  `idusuario` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idsolicitud_respuesta`),
  KEY `fk_solicitudes_respuestas_solicitudes_soporte1_idx` (`idsolicitud`),
  KEY `fk_solicitudes_respuestas_usuarios1_idx` (`idusuario`),
  CONSTRAINT `fk_solicitudes_respuestas_solicitudes_soporte1` FOREIGN KEY (`idsolicitud`) REFERENCES `solicitudes_soporte` (`idsolicitud`),
  CONSTRAINT `fk_solicitudes_respuestas_usuarios1` FOREIGN KEY (`idusuario`) REFERENCES `usuarios` (`idusuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_solicitudes_respuestas_insert` AFTER INSERT ON `solicitudes_respuestas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'responder',
        'solicitudes_respuestas',
        NEW.idsolicitud_respuesta,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idsolicitud_respuesta', NEW.idsolicitud_respuesta,
            'idsolicitud', NEW.idsolicitud,
            'idusuario_respuesta', NEW.idusuario,
            'es_interno', NEW.es_interno
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_solicitudes_respuestas_update` AFTER UPDATE ON `solicitudes_respuestas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'solicitudes_respuestas',
        NEW.idsolicitud_respuesta,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idsolicitud_respuesta', NEW.idsolicitud_respuesta,
            'idsolicitud_anterior', OLD.idsolicitud,
            'idsolicitud_nueva', NEW.idsolicitud,
            'idusuario_anterior', OLD.idusuario,
            'idusuario_nuevo', NEW.idusuario,
            'es_interno_anterior', OLD.es_interno,
            'es_interno_nuevo', NEW.es_interno
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_solicitudes_respuestas_delete` AFTER DELETE ON `solicitudes_respuestas` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'solicitudes_respuestas',
        OLD.idsolicitud_respuesta,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idsolicitud_respuesta', OLD.idsolicitud_respuesta,
            'idsolicitud', OLD.idsolicitud,
            'idusuario_respuesta', OLD.idusuario,
            'es_interno', OLD.es_interno
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `solicitudes_soporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_soporte` (
  `idsolicitud` int unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dependencia` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asunto` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_origen` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consentimiento_privacidad` tinyint(1) NOT NULL DEFAULT '0',
  `codigo_ticket` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idarchivo` int unsigned DEFAULT NULL,
  `idtiposoporte` tinyint unsigned NOT NULL,
  `idprioridad` tinyint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idusuario_atendio` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idsolicitud`),
  UNIQUE KEY `codigo_ticket_UNIQUE` (`codigo_ticket`),
  KEY `idx_solicitudes_email` (`email`),
  KEY `idx_solicitudes_created_at` (`created_at`),
  KEY `fk_solicitudes_tipo_idx` (`idtiposoporte`),
  KEY `fk_solicitudes_prioridad_idx` (`idprioridad`),
  KEY `fk_solicitudes_estado_idx` (`idestado`),
  KEY `fk_solicitudes_usuario_idx` (`idusuario_atendio`),
  KEY `fk_solicitudes_soporte_archivos1_idx` (`idarchivo`),
  CONSTRAINT `fk_solicitudes_estado` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`) ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitudes_prioridad` FOREIGN KEY (`idprioridad`) REFERENCES `prioridades` (`idprioridad`) ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitudes_soporte_archivos1` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitudes_tipo` FOREIGN KEY (`idtiposoporte`) REFERENCES `tipos_soporte` (`idtiposoporte`) ON DELETE RESTRICT,
  CONSTRAINT `fk_solicitudes_usuario` FOREIGN KEY (`idusuario_atendio`) REFERENCES `usuarios` (`idusuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_solicitudes_soporte_insert` AFTER INSERT ON `solicitudes_soporte` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'solicitudes_soporte',
        NEW.idsolicitud,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idsolicitud', NEW.idsolicitud,
            'codigo_ticket', NEW.codigo_ticket,
            'nombres', NEW.nombres,
            'email', NEW.email,
            'telefono', NEW.telefono,
            'dependencia', NEW.dependencia,
            'asunto', NEW.asunto,
            'ip_origen_solicitud', NEW.ip_origen,
            'consentimiento_privacidad', NEW.consentimiento_privacidad,
            'idarchivo', NEW.idarchivo,
            'idtiposoporte', NEW.idtiposoporte,
            'idprioridad', NEW.idprioridad,
            'idestado', NEW.idestado,
            'idusuario_atendio', NEW.idusuario_atendio
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_solicitudes_soporte_update` AFTER UPDATE ON `solicitudes_soporte` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'solicitudes_soporte',
        NEW.idsolicitud,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'codigo_ticket', NEW.codigo_ticket,
            'nombres_anterior', OLD.nombres,
            'nombres_nuevo', NEW.nombres,
            'email_anterior', OLD.email,
            'email_nuevo', NEW.email,
            'telefono_anterior', OLD.telefono,
            'telefono_nuevo', NEW.telefono,
            'dependencia_anterior', OLD.dependencia,
            'dependencia_nueva', NEW.dependencia,
            'asunto_anterior', OLD.asunto,
            'asunto_nuevo', NEW.asunto,
            'idarchivo_anterior', OLD.idarchivo,
            'idarchivo_nuevo', NEW.idarchivo,
            'idtiposoporte_anterior', OLD.idtiposoporte,
            'idtiposoporte_nuevo', NEW.idtiposoporte,
            'idprioridad_anterior', OLD.idprioridad,
            'idprioridad_nuevo', NEW.idprioridad,
            'idestado_anterior', OLD.idestado,
            'idestado_nuevo', NEW.idestado,
            'idusuario_atendio_anterior', OLD.idusuario_atendio,
            'idusuario_atendio_nuevo', NEW.idusuario_atendio
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_solicitudes_soporte_delete` AFTER DELETE ON `solicitudes_soporte` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'solicitudes_soporte',
        OLD.idsolicitud,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idsolicitud', OLD.idsolicitud,
            'codigo_ticket', OLD.codigo_ticket,
            'nombres', OLD.nombres,
            'email', OLD.email,
            'telefono', OLD.telefono,
            'dependencia', OLD.dependencia,
            'asunto', OLD.asunto,
            'ip_origen_solicitud', OLD.ip_origen,
            'consentimiento_privacidad', OLD.consentimiento_privacidad,
            'idarchivo', OLD.idarchivo,
            'idtiposoporte', OLD.idtiposoporte,
            'idprioridad', OLD.idprioridad,
            'idestado', OLD.idestado,
            'idusuario_atendio', OLD.idusuario_atendio
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tipos_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_documento` (
  `idtipodocumento` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtipodocumento`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_documento_insert` AFTER INSERT ON `tipos_documento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tipos_documento',
        NEW.idtipodocumento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipodocumento', NEW.idtipodocumento,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_documento_update` AFTER UPDATE ON `tipos_documento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tipos_documento',
        NEW.idtipodocumento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_documento_delete` AFTER DELETE ON `tipos_documento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tipos_documento',
        OLD.idtipodocumento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipodocumento', OLD.idtipodocumento,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tipos_entidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_entidad` (
  `idtipoentidad` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtipoentidad`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_entidad_insert` AFTER INSERT ON `tipos_entidad` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tipos_entidad',
        NEW.idtipoentidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipoentidad', NEW.idtipoentidad,
            'nombre', NEW.nombre,
            'slug', NEW.slug
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_entidad_update` AFTER UPDATE ON `tipos_entidad` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tipos_entidad',
        NEW.idtipoentidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_entidad_delete` AFTER DELETE ON `tipos_entidad` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tipos_entidad',
        OLD.idtipoentidad,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipoentidad', OLD.idtipoentidad,
            'nombre', OLD.nombre,
            'slug', OLD.slug
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tipos_evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_evento` (
  `idtipoevento` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtipoevento`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_evento_insert` AFTER INSERT ON `tipos_evento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tipos_evento',
        NEW.idtipoevento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipoevento', NEW.idtipoevento,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_evento_update` AFTER UPDATE ON `tipos_evento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tipos_evento',
        NEW.idtipoevento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_evento_delete` AFTER DELETE ON `tipos_evento` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tipos_evento',
        OLD.idtipoevento,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipoevento', OLD.idtipoevento,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tipos_publicacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_publicacion` (
  `idtipopublicacion` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtipopublicacion`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_publicacion_insert` AFTER INSERT ON `tipos_publicacion` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tipos_publicacion',
        NEW.idtipopublicacion,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipopublicacion', NEW.idtipopublicacion,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_publicacion_update` AFTER UPDATE ON `tipos_publicacion` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tipos_publicacion',
        NEW.idtipopublicacion,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_publicacion_delete` AFTER DELETE ON `tipos_publicacion` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tipos_publicacion',
        OLD.idtipopublicacion,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipopublicacion', OLD.idtipopublicacion,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tipos_soporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_soporte` (
  `idtiposoporte` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtiposoporte`),
  UNIQUE KEY `idx_tipos_soporte_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_soporte_insert` AFTER INSERT ON `tipos_soporte` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tipos_soporte',
        NEW.idtiposoporte,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtiposoporte', NEW.idtiposoporte,
            'nombre', NEW.nombre,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_soporte_update` AFTER UPDATE ON `tipos_soporte` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tipos_soporte',
        NEW.idtiposoporte,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_soporte_delete` AFTER DELETE ON `tipos_soporte` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tipos_soporte',
        OLD.idtiposoporte,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtiposoporte', OLD.idtiposoporte,
            'nombre', OLD.nombre,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tipos_tutorial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_tutorial` (
  `idtipotutorial` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtipotutorial`),
  UNIQUE KEY `slug_UNIQUE` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_tutorial_insert` AFTER INSERT ON `tipos_tutorial` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tipos_tutorial',
        NEW.idtipotutorial,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipotutorial', NEW.idtipotutorial,
            'nombre', NEW.nombre,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'activo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_tutorial_update` AFTER UPDATE ON `tipos_tutorial` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tipos_tutorial',
        NEW.idtipotutorial,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_anterior', OLD.nombre,
            'nombre_nuevo', NEW.nombre,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tipos_tutorial_delete` AFTER DELETE ON `tipos_tutorial` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tipos_tutorial',
        OLD.idtipotutorial,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtipotutorial', OLD.idtipotutorial,
            'nombre', OLD.nombre,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'activo', OLD.activo
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `tutoriales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoriales` (
  `idtutorial` int unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `contenido_html` longtext COLLATE utf8mb4_unicode_ci,
  `enlace_video` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duracion_minutos` smallint unsigned DEFAULT NULL,
  `visitas` int unsigned NOT NULL DEFAULT '0',
  `orden` tinyint unsigned NOT NULL DEFAULT '0',
  `fecha_publicacion` datetime DEFAULT NULL,
  `idarchivo` int unsigned DEFAULT NULL COMMENT 'Archivo adjunto opcional',
  `idcategoria` smallint unsigned NOT NULL,
  `idusuario_autor` bigint unsigned NOT NULL,
  `idestado` tinyint unsigned NOT NULL,
  `idtipotutorial` tinyint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idtutorial`),
  UNIQUE KEY `idx_tutoriales_slug` (`slug`),
  KEY `fk_tutoriales_archivo_idx` (`idarchivo`),
  KEY `fk_tutoriales_categoria_idx` (`idcategoria`),
  KEY `fk_tutoriales_autor_idx` (`idusuario_autor`),
  KEY `fk_tutoriales_estado_idx` (`idestado`),
  KEY `fk_tutoriales_tipos_tutorial1_idx` (`idtipotutorial`),
  CONSTRAINT `fk_tutoriales_archivo` FOREIGN KEY (`idarchivo`) REFERENCES `archivos` (`idarchivo`) ON DELETE SET NULL,
  CONSTRAINT `fk_tutoriales_autor` FOREIGN KEY (`idusuario_autor`) REFERENCES `usuarios` (`idusuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tutoriales_categoria` FOREIGN KEY (`idcategoria`) REFERENCES `categorias` (`idcategoria`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tutoriales_estado` FOREIGN KEY (`idestado`) REFERENCES `estados` (`idestado`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tutoriales_tipos_tutorial1` FOREIGN KEY (`idtipotutorial`) REFERENCES `tipos_tutorial` (`idtipotutorial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tutoriales_insert` AFTER INSERT ON `tutoriales` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'tutoriales',
        NEW.idtutorial,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtutorial', NEW.idtutorial,
            'titulo', NEW.titulo,
            'slug', NEW.slug,
            'descripcion', NEW.descripcion,
            'enlace_video', NEW.enlace_video,
            'duracion_minutos', NEW.duracion_minutos,
            'visitas', NEW.visitas,
            'orden', NEW.orden,
            'fecha_publicacion', NEW.fecha_publicacion,
            'idarchivo', NEW.idarchivo,
            'idcategoria', NEW.idcategoria,
            'idusuario_autor', NEW.idusuario_autor,
            'idestado', NEW.idestado,
            'idtipotutorial', NEW.idtipotutorial
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tutoriales_update` AFTER UPDATE ON `tutoriales` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'tutoriales',
        NEW.idtutorial,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'titulo_anterior', OLD.titulo,
            'titulo_nuevo', NEW.titulo,
            'slug_anterior', OLD.slug,
            'slug_nuevo', NEW.slug,
            'descripcion_anterior', OLD.descripcion,
            'descripcion_nueva', NEW.descripcion,
            'enlace_video_anterior', OLD.enlace_video,
            'enlace_video_nuevo', NEW.enlace_video,
            'duracion_minutos_anterior', OLD.duracion_minutos,
            'duracion_minutos_nuevo', NEW.duracion_minutos,
            'visitas_anterior', OLD.visitas,
            'visitas_nuevo', NEW.visitas,
            'orden_anterior', OLD.orden,
            'orden_nuevo', NEW.orden,
            'fecha_publicacion_anterior', OLD.fecha_publicacion,
            'fecha_publicacion_nueva', NEW.fecha_publicacion,
            'idarchivo_anterior', OLD.idarchivo,
            'idarchivo_nuevo', NEW.idarchivo,
            'idcategoria_anterior', OLD.idcategoria,
            'idcategoria_nueva', NEW.idcategoria,
            'idestado_anterior', OLD.idestado,
            'idestado_nuevo', NEW.idestado,
            'idtipotutorial_anterior', OLD.idtipotutorial,
            'idtipotutorial_nuevo', NEW.idtipotutorial
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_tutoriales_delete` AFTER DELETE ON `tutoriales` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'tutoriales',
        OLD.idtutorial,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idtutorial', OLD.idtutorial,
            'titulo', OLD.titulo,
            'slug', OLD.slug,
            'descripcion', OLD.descripcion,
            'enlace_video', OLD.enlace_video,
            'duracion_minutos', OLD.duracion_minutos,
            'visitas', OLD.visitas,
            'orden', OLD.orden,
            'fecha_publicacion', OLD.fecha_publicacion,
            'idarchivo', OLD.idarchivo,
            'idcategoria', OLD.idcategoria,
            'idusuario_autor', OLD.idusuario_autor,
            'idestado', OLD.idestado,
            'idtipotutorial', OLD.idtipotutorial
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idusuario` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idrol` tinyint unsigned NOT NULL DEFAULT '2' COMMENT '1:admin, 2:editor, 3:lector',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idusuario`),
  UNIQUE KEY `idx_usuarios_email` (`email`),
  KEY `idx_usuarios_activo` (`activo`),
  KEY `fk_usuarios_rol_idx` (`idrol`),
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`idrol`) REFERENCES `roles` (`idrol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_usuarios_insert` AFTER INSERT ON `usuarios` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'crear',
        'usuarios',
        NEW.idusuario,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idusuario', NEW.idusuario,
            'nombre_completo', NEW.nombre_completo,
            'email', NEW.email,
            'email_verified_at', NEW.email_verified_at,
            'idrol', NEW.idrol,
            'activo', NEW.activo,
            'ultimo_acceso', NEW.ultimo_acceso
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_usuarios_update` AFTER UPDATE ON `usuarios` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'actualizar',
        'usuarios',
        NEW.idusuario,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'nombre_completo_anterior', OLD.nombre_completo,
            'nombre_completo_nuevo', NEW.nombre_completo,
            'email_anterior', OLD.email,
            'email_nuevo', NEW.email,
            'email_verified_at_anterior', OLD.email_verified_at,
            'email_verified_at_nuevo', NEW.email_verified_at,
            'idrol_anterior', OLD.idrol,
            'idrol_nuevo', NEW.idrol,
            'activo_anterior', OLD.activo,
            'activo_nuevo', NEW.activo,
            'ultimo_acceso_anterior', OLD.ultimo_acceso,
            'ultimo_acceso_nuevo', NEW.ultimo_acceso,
            'password_modificado', IF(OLD.password_hash <> NEW.password_hash, true, false)
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_usuarios_delete` AFTER DELETE ON `usuarios` FOR EACH ROW BEGIN
    INSERT INTO logs_actividad (
        idusuario,
        accion,
        entidad,
        identificador_entidad,
        ip_origen,
        user_agent,
        detalles,
        created_at
    ) VALUES (
        @usuario_auditoria,
        'eliminar',
        'usuarios',
        OLD.idusuario,
        @ip_auditoria,
        @user_agent_auditoria,
        JSON_OBJECT(
            'idusuario', OLD.idusuario,
            'nombre_completo', OLD.nombre_completo,
            'email', OLD.email,
            'email_verified_at', OLD.email_verified_at,
            'idrol', OLD.idrol,
            'activo', OLD.activo,
            'ultimo_acceso', OLD.ultimo_acceso
        ),
        NOW()
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000001_create_cache_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'2026_05_05_152905_create_personal_access_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2026_05_13_030016_create_sessions_table',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2026_07_21_000000_add_archivos_to_enlaces_sistemas_table',3);
