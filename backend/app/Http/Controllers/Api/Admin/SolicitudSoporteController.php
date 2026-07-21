<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\SolicitudRespuesta;
use App\Models\SolicitudSoporte;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SolicitudSoporteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SolicitudSoporte::with([
            'archivo',
            'tipoSoporte',
            'prioridad',
            'estado',
            'usuarioAtendio',
        ])
            ->withCount('respuestas')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('codigo_ticket', 'like', "%{$buscar}%")
                    ->orWhere('nombres', 'like', "%{$buscar}%")
                    ->orWhere('email', 'like', "%{$buscar}%")
                    ->orWhere('asunto', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idtiposoporte')) {
            $query->where('idtiposoporte', $request->idtiposoporte);
        }

        if ($request->filled('idprioridad')) {
            $query->where('idprioridad', $request->idprioridad);
        }

        if ($request->filled('idestado')) {
            $query->where('idestado', $request->idestado);
        }

        if ($request->filled('idusuario_atendio')) {
            $query->where('idusuario_atendio', $request->idusuario_atendio);
        }

        $solicitudes = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de solicitudes de soporte obtenido correctamente.',
            'data' => $solicitudes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombres' => [
                'required',
                'string',
                'max:150',
            ],
            'email' => [
                'required',
                'email',
                'max:150',
            ],
            'telefono' => [
                'nullable',
                'string',
                'max:20',
            ],
            'dependencia' => [
                'nullable',
                'string',
                'max:150',
            ],
            'asunto' => [
                'required',
                'string',
                'max:200',
            ],
            'descripcion' => [
                'required',
                'string',
                'min:10',
            ],
            'consentimiento_privacidad' => [
                'required',
                'accepted',
            ],
            'idtiposoporte' => [
                'required',
                'integer',
                'exists:tipos_soporte,idtiposoporte',
            ],
            'idprioridad' => [
                'required',
                'integer',
                'exists:prioridades,idprioridad',
            ],
            'idestado' => [
                'required',
                'integer',
                'exists:estados,idestado',
            ],
            'idusuario_atendio' => [
                'nullable',
                'integer',
                'exists:usuarios,idusuario',
            ],
            'adjunto' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
        ], [
            'nombres.required' => 'Los nombres son obligatorios.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'asunto.required' => 'El asunto es obligatorio.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.min' => 'La descripción debe tener como mínimo 10 caracteres.',
            'consentimiento_privacidad.required' => 'Debe aceptar la política de privacidad.',
            'consentimiento_privacidad.accepted' => 'Debe aceptar la política de privacidad.',
            'idtiposoporte.required' => 'El tipo de soporte es obligatorio.',
            'idtiposoporte.exists' => 'El tipo de soporte seleccionado no existe.',
            'idprioridad.required' => 'La prioridad es obligatoria.',
            'idprioridad.exists' => 'La prioridad seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idusuario_atendio.exists' => 'El usuario asignado no existe.',
            'adjunto.mimes' => 'El adjunto debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'adjunto.max' => 'El adjunto no debe superar los 10 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $idArchivo = null;

        if ($request->hasFile('adjunto')) {
            $archivoSubido = $request->file('adjunto');

            $nombreOriginal = $archivoSubido->getClientOriginalName();
            $extension = $archivoSubido->getClientOriginalExtension();
            $mimeType = $archivoSubido->getMimeType();
            $pesoBytes = $archivoSubido->getSize();

            $nombreGuardado = 'soporte_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
            $ruta = $archivoSubido->storeAs('soporte', $nombreGuardado, 'public');

            $archivo = Archivo::create([
                'nombre_original' => $nombreOriginal,
                'nombre_guardado' => $nombreGuardado,
                'ruta' => $ruta,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'peso_bytes' => $pesoBytes,
                'descargas' => 0,
            ]);

            $idArchivo = $archivo->idarchivo;
        }

        $solicitud = SolicitudSoporte::create([
            'nombres' => $request->nombres,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'dependencia' => $request->dependencia,
            'asunto' => $request->asunto,
            'descripcion' => $request->descripcion,
            'idarchivo' => $idArchivo,
            'ip_origen' => $request->ip(),
            'consentimiento_privacidad' => $request->boolean('consentimiento_privacidad'),
            'codigo_ticket' => $this->generarCodigoTicket(),
            'idtiposoporte' => $request->idtiposoporte,
            'idprioridad' => $request->idprioridad,
            'idestado' => $request->idestado,
            'idusuario_atendio' => $request->idusuario_atendio,
        ]);

        $solicitud->load([
            'archivo',
            'tipoSoporte',
            'prioridad',
            'estado',
            'usuarioAtendio',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Solicitud de soporte registrada correctamente.',
            'data' => $solicitud,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $solicitud = SolicitudSoporte::with([
            'archivo',
            'tipoSoporte',
            'prioridad',
            'estado',
            'usuarioAtendio',
            'respuestas.usuario',
        ])->find($id);

        if (!$solicitud) {
            return response()->json([
                'success' => false,
                'message' => 'Solicitud de soporte no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Solicitud de soporte obtenida correctamente.',
            'data' => $solicitud,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $solicitud = SolicitudSoporte::with('archivo')->find($id);

        if (!$solicitud) {
            return response()->json([
                'success' => false,
                'message' => 'Solicitud de soporte no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombres' => [
                'required',
                'string',
                'max:150',
            ],
            'email' => [
                'required',
                'email',
                'max:150',
            ],
            'telefono' => [
                'nullable',
                'string',
                'max:20',
            ],
            'dependencia' => [
                'nullable',
                'string',
                'max:150',
            ],
            'asunto' => [
                'required',
                'string',
                'max:200',
            ],
            'descripcion' => [
                'required',
                'string',
                'min:10',
            ],
            'consentimiento_privacidad' => [
                'required',
                'accepted',
            ],
            'idtiposoporte' => [
                'required',
                'integer',
                'exists:tipos_soporte,idtiposoporte',
            ],
            'idprioridad' => [
                'required',
                'integer',
                'exists:prioridades,idprioridad',
            ],
            'idestado' => [
                'required',
                'integer',
                'exists:estados,idestado',
            ],
            'idusuario_atendio' => [
                'nullable',
                'integer',
                'exists:usuarios,idusuario',
            ],
            'adjunto' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
        ], [
            'nombres.required' => 'Los nombres son obligatorios.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'asunto.required' => 'El asunto es obligatorio.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.min' => 'La descripción debe tener como mínimo 10 caracteres.',
            'consentimiento_privacidad.required' => 'Debe aceptar la política de privacidad.',
            'consentimiento_privacidad.accepted' => 'Debe aceptar la política de privacidad.',
            'idtiposoporte.exists' => 'El tipo de soporte seleccionado no existe.',
            'idprioridad.exists' => 'La prioridad seleccionada no existe.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idusuario_atendio.exists' => 'El usuario asignado no existe.',
            'adjunto.mimes' => 'El adjunto debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'adjunto.max' => 'El adjunto no debe superar los 10 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $archivoAnterior = null;

        if ($request->hasFile('adjunto')) {
            $archivoAnterior = $solicitud->archivo;

            $archivoSubido = $request->file('adjunto');

            $nombreOriginal = $archivoSubido->getClientOriginalName();
            $extension = $archivoSubido->getClientOriginalExtension();
            $mimeType = $archivoSubido->getMimeType();
            $pesoBytes = $archivoSubido->getSize();

            $nombreGuardado = 'soporte_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
            $ruta = $archivoSubido->storeAs('soporte', $nombreGuardado, 'public');

            $nuevoArchivo = Archivo::create([
                'nombre_original' => $nombreOriginal,
                'nombre_guardado' => $nombreGuardado,
                'ruta' => $ruta,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'peso_bytes' => $pesoBytes,
                'descargas' => 0,
            ]);

            $solicitud->idarchivo = $nuevoArchivo->idarchivo;
        }

        $solicitud->update([
            'nombres' => $request->nombres,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'dependencia' => $request->dependencia,
            'asunto' => $request->asunto,
            'descripcion' => $request->descripcion,
            'idarchivo' => $solicitud->idarchivo,
            'consentimiento_privacidad' => $request->boolean('consentimiento_privacidad'),
            'idtiposoporte' => $request->idtiposoporte,
            'idprioridad' => $request->idprioridad,
            'idestado' => $request->idestado,
            'idusuario_atendio' => $request->idusuario_atendio,
        ]);

        if ($archivoAnterior) {
            $usosArchivo = SolicitudSoporte::where('idarchivo', $archivoAnterior->idarchivo)->count();

            if ($usosArchivo === 0) {
                Storage::disk('public')->delete($archivoAnterior->ruta);
                $archivoAnterior->delete();
            }
        }

        $solicitud->load([
            'archivo',
            'tipoSoporte',
            'prioridad',
            'estado',
            'usuarioAtendio',
            'respuestas.usuario',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Solicitud de soporte actualizada correctamente.',
            'data' => $solicitud,
        ]);
    }

    public function responder(Request $request, int $id): JsonResponse
    {
        $solicitud = SolicitudSoporte::find($id);

        if (!$solicitud) {
            return response()->json([
                'success' => false,
                'message' => 'Solicitud de soporte no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'mensaje' => [
                'required',
                'string',
                'min:3',
            ],
            'es_interno' => [
                'nullable',
                'boolean',
            ],
        ], [
            'mensaje.required' => 'El mensaje de respuesta es obligatorio.',
            'mensaje.min' => 'El mensaje debe tener como mínimo 3 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $respuesta = SolicitudRespuesta::create([
            'mensaje' => $request->mensaje,
            'es_interno' => $request->has('es_interno') ? $request->boolean('es_interno') : false,
            'idsolicitud' => $solicitud->idsolicitud,
            'idusuario' => $request->user()->idusuario,
        ]);

        if (!$solicitud->idusuario_atendio) {
            $solicitud->update([
                'idusuario_atendio' => $request->user()->idusuario,
            ]);
        }

        $respuesta->load('usuario');

        return response()->json([
            'success' => true,
            'message' => 'Respuesta registrada correctamente.',
            'data' => $respuesta,
        ], 201);
    }

    public function eliminarRespuesta(int $id): JsonResponse
    {
        $respuesta = SolicitudRespuesta::find($id);

        if (!$respuesta) {
            return response()->json([
                'success' => false,
                'message' => 'Respuesta no encontrada.',
            ], 404);
        }

        $respuesta->delete();

        return response()->json([
            'success' => true,
            'message' => 'Respuesta eliminada correctamente.',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $solicitud = SolicitudSoporte::with('archivo')
            ->withCount('respuestas')
            ->find($id);

        if (!$solicitud) {
            return response()->json([
                'success' => false,
                'message' => 'Solicitud de soporte no encontrada.',
            ], 404);
        }

        if ($solicitud->respuestas_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la solicitud porque tiene respuestas asociadas.',
                'data' => [
                    'respuestas' => $solicitud->respuestas_count,
                ],
            ], 409);
        }

        $archivo = $solicitud->archivo;

        $solicitud->delete();

        if ($archivo) {
            $usosArchivo = SolicitudSoporte::where('idarchivo', $archivo->idarchivo)->count();

            if ($usosArchivo === 0) {
                Storage::disk('public')->delete($archivo->ruta);
                $archivo->delete();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Solicitud de soporte eliminada correctamente.',
        ]);
    }

    private function generarCodigoTicket(): string
    {
        do {
            $codigo = 'DSTI-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
        } while (SolicitudSoporte::where('codigo_ticket', $codigo)->exists());

        return $codigo;
    }
}
