<?php

namespace App\Services;

use App\Models\Archivo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ArchivoService
{
    public function guardarImagenNoticia(UploadedFile $archivo): Archivo
    {
        $extension = $archivo->getClientOriginalExtension();

        $nombreOriginal = $archivo->getClientOriginalName();

        $nombreGuardado = 'noticia_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;

        $ruta = $archivo->storeAs(
            'noticias',
            $nombreGuardado,
            'public'
        );

        return Archivo::create([
            'nombre_original' => $nombreOriginal,
            'nombre_guardado' => $nombreGuardado,
            'ruta' => 'storage/' . $ruta,
            'extension' => $extension,
            'mime_type' => $archivo->getMimeType(),
            'peso_bytes' => $archivo->getSize(),
            'descargas' => 0,
        ]);
    }
}
