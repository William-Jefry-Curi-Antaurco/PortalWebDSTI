<?php

namespace App\Services;

use App\Models\Archivo;
use Illuminate\Support\Facades\Storage;

/**
 * Centraliza la limpieza de archivos huérfanos: cuando un registro
 * reemplaza o suelta su referencia a un `Archivo`, hay que borrar el
 * archivo físico y su fila en `archivos` solo si ningún otro registro
 * de ningún módulo lo sigue usando. Antes cada controlador reimplementaba
 * esta comprobación a mano y cada una revisaba un subconjunto distinto
 * de tablas (algunas ni siquiera comprobaban enlaces_sistemas o
 * portal_configuracion), lo que podía borrar un archivo todavía en uso
 * en otro módulo.
 */
class ArchivoLimpiezaService
{
    public function estaEnUso(int $idarchivo): bool
    {
        $archivo = Archivo::find($idarchivo);

        if (!$archivo) {
            return false;
        }

        return $archivo->documentos()->exists()
            || $archivo->noticiasImagen()->exists()
            || $archivo->eventos()->exists()
            || $archivo->eventosArchivos()->exists()
            || $archivo->tutoriales()->exists()
            || $archivo->proyectos()->exists()
            || $archivo->solicitudesSoporte()->exists()
            || $archivo->enlacesSistemasManual()->exists()
            || $archivo->enlacesSistemasDocumentacion()->exists()
            || $archivo->portalConfiguraciones()->exists();
    }

    /**
     * Borra el archivo físico y su fila en `archivos` si ya no lo usa
     * ningún registro. Se le pasa el Archivo ya cargado (o null) para no
     * repetir la consulta que cada controlador ya hizo antes de reemplazarlo.
     */
    public function eliminarSiNoEstaEnUso(?Archivo $archivo): void
    {
        if (!$archivo) {
            return;
        }

        if ($this->estaEnUso($archivo->idarchivo)) {
            return;
        }

        Storage::disk('public')->delete($archivo->ruta);
        $archivo->delete();
    }
}
