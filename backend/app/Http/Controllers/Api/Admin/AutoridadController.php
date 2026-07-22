<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Autoridad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AutoridadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Autoridad::query()
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre_completo', 'like', "%{$buscar}%")
                    ->orWhere('cargo', 'like', "%{$buscar}%")
                    ->orWhere('correo_institucional', 'like', "%{$buscar}%")
                    ->orWhere('funciones_principales', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        $autoridades = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de autoridades obtenido correctamente.',
            'data' => $autoridades,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_completo' => [
                'required',
                'string',
                'max:150',
            ],
            'cargo' => [
                'required',
                'string',
                'max:100',
            ],
            'funciones_principales' => [
                'nullable',
                'string',
            ],
            'correo_institucional' => [
                'nullable',
                'email',
                'max:100',
            ],
            'foto_url' => [
                'nullable',
                'string',
                'max:255',
            ],
            'cv_url' => [
                'nullable',
                'string',
                'max:255',
            ],
            'foto' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'cv' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
            'fecha_inicio_gestion' => [
                'nullable',
                'date',
            ],
            'fecha_fin_gestion' => [
                'nullable',
                'date',
                'after_or_equal:fecha_inicio_gestion',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
        ], [
            'nombre_completo.required' => 'El nombre completo de la autoridad es obligatorio.',
            'nombre_completo.max' => 'El nombre completo no debe superar los 150 caracteres.',
            'cargo.required' => 'El cargo es obligatorio.',
            'cargo.max' => 'El cargo no debe superar los 100 caracteres.',
            'correo_institucional.email' => 'El correo institucional no tiene un formato válido.',
            'foto.image' => 'La foto debe ser una imagen válida.',
            'foto.mimes' => 'La foto debe ser JPG, JPEG, PNG o WEBP.',
            'foto.max' => 'La foto no debe superar los 5 MB.',
            'cv.mimes' => 'El CV debe ser PDF, Word o DOCX.',
            'cv.max' => 'El CV no debe superar los 10 MB.',
            'fecha_fin_gestion.after_or_equal' => 'La fecha de fin de gestión debe ser igual o posterior a la fecha de inicio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $fotoGuardada = null;
        $cvGuardado = null;

        try {
            $autoridad = DB::transaction(function () use ($request, &$fotoGuardada, &$cvGuardado) {
                $fotoUrl = $request->foto_url;
                $cvUrl = $request->cv_url;

                if ($request->hasFile('foto')) {
                    $foto = $request->file('foto');
                    $extension = $foto->getClientOriginalExtension();
                    $nombreFoto = 'autoridad_foto_' . now()->format('YmdHis') . '_' . uniqid() . '.' . $extension;
                    $fotoUrl = $fotoGuardada = $foto->storeAs('autoridades/fotos', $nombreFoto, 'public');
                }

                if ($request->hasFile('cv')) {
                    $cv = $request->file('cv');
                    $extension = $cv->getClientOriginalExtension();
                    $nombreCv = 'autoridad_cv_' . now()->format('YmdHis') . '_' . uniqid() . '.' . $extension;
                    $cvUrl = $cvGuardado = $cv->storeAs('autoridades/cv', $nombreCv, 'public');
                }

                return Autoridad::create([
                    'nombre_completo' => $request->nombre_completo,
                    'cargo' => $request->cargo,
                    'funciones_principales' => $request->funciones_principales,
                    'correo_institucional' => $request->correo_institucional,
                    'foto_url' => $fotoUrl,
                    'cv_url' => $cvUrl,
                    'orden' => $request->orden ?? 0,
                    'fecha_inicio_gestion' => $request->fecha_inicio_gestion,
                    'fecha_fin_gestion' => $request->fecha_fin_gestion,
                    'activo' => $request->has('activo') ? $request->boolean('activo') : true,
                ]);
            });
        } catch (\Throwable $e) {
            if ($fotoGuardada) {
                Storage::disk('public')->delete($fotoGuardada);
            }

            if ($cvGuardado) {
                Storage::disk('public')->delete($cvGuardado);
            }

            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Autoridad registrada correctamente.',
            'data' => $autoridad,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $autoridad = Autoridad::find($id);

        if (!$autoridad) {
            return response()->json([
                'success' => false,
                'message' => 'Autoridad no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Autoridad obtenida correctamente.',
            'data' => $autoridad,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $autoridad = Autoridad::find($id);

        if (!$autoridad) {
            return response()->json([
                'success' => false,
                'message' => 'Autoridad no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre_completo' => [
                'required',
                'string',
                'max:150',
            ],
            'cargo' => [
                'required',
                'string',
                'max:100',
            ],
            'funciones_principales' => [
                'nullable',
                'string',
            ],
            'correo_institucional' => [
                'nullable',
                'email',
                'max:100',
            ],
            'foto_url' => [
                'nullable',
                'string',
                'max:255',
            ],
            'cv_url' => [
                'nullable',
                'string',
                'max:255',
            ],
            'foto' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'cv' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
            'fecha_inicio_gestion' => [
                'nullable',
                'date',
            ],
            'fecha_fin_gestion' => [
                'nullable',
                'date',
                'after_or_equal:fecha_inicio_gestion',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
        ], [
            'nombre_completo.required' => 'El nombre completo de la autoridad es obligatorio.',
            'cargo.required' => 'El cargo es obligatorio.',
            'correo_institucional.email' => 'El correo institucional no tiene un formato válido.',
            'foto.image' => 'La foto debe ser una imagen válida.',
            'foto.mimes' => 'La foto debe ser JPG, JPEG, PNG o WEBP.',
            'foto.max' => 'La foto no debe superar los 5 MB.',
            'cv.mimes' => 'El CV debe ser PDF, Word o DOCX.',
            'cv.max' => 'El CV no debe superar los 10 MB.',
            'fecha_fin_gestion.after_or_equal' => 'La fecha de fin de gestión debe ser igual o posterior a la fecha de inicio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $fotoAnterior = $autoridad->foto_url;
        $cvAnterior = $autoridad->cv_url;
        $fotoGuardada = null;
        $cvGuardado = null;

        try {
            DB::transaction(function () use ($request, $autoridad, &$fotoGuardada, &$cvGuardado) {
                $fotoUrl = $request->foto_url ?? $autoridad->foto_url;
                $cvUrl = $request->cv_url ?? $autoridad->cv_url;

                if ($request->hasFile('foto')) {
                    $foto = $request->file('foto');
                    $extension = $foto->getClientOriginalExtension();
                    $nombreFoto = 'autoridad_foto_' . now()->format('YmdHis') . '_' . uniqid() . '.' . $extension;
                    $fotoUrl = $fotoGuardada = $foto->storeAs('autoridades/fotos', $nombreFoto, 'public');
                }

                if ($request->hasFile('cv')) {
                    $cv = $request->file('cv');
                    $extension = $cv->getClientOriginalExtension();
                    $nombreCv = 'autoridad_cv_' . now()->format('YmdHis') . '_' . uniqid() . '.' . $extension;
                    $cvUrl = $cvGuardado = $cv->storeAs('autoridades/cv', $nombreCv, 'public');
                }

                $autoridad->update([
                    'nombre_completo' => $request->nombre_completo,
                    'cargo' => $request->cargo,
                    'funciones_principales' => $request->funciones_principales,
                    'correo_institucional' => $request->correo_institucional,
                    'foto_url' => $fotoUrl,
                    'cv_url' => $cvUrl,
                    'orden' => $request->orden ?? 0,
                    'fecha_inicio_gestion' => $request->fecha_inicio_gestion,
                    'fecha_fin_gestion' => $request->fecha_fin_gestion,
                    'activo' => $request->has('activo') ? $request->boolean('activo') : true,
                ]);
            });
        } catch (\Throwable $e) {
            if ($fotoGuardada) {
                Storage::disk('public')->delete($fotoGuardada);
            }

            if ($cvGuardado) {
                Storage::disk('public')->delete($cvGuardado);
            }

            throw $e;
        }

        if ($request->hasFile('foto') && $fotoAnterior && !$this->esUrlExterna($fotoAnterior)) {
            Storage::disk('public')->delete($fotoAnterior);
        }

        if ($request->hasFile('cv') && $cvAnterior && !$this->esUrlExterna($cvAnterior)) {
            Storage::disk('public')->delete($cvAnterior);
        }

        return response()->json([
            'success' => true,
            'message' => 'Autoridad actualizada correctamente.',
            'data' => $autoridad,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $autoridad = Autoridad::find($id);

        if (!$autoridad) {
            return response()->json([
                'success' => false,
                'message' => 'Autoridad no encontrada.',
            ], 404);
        }

        $fotoUrl = $autoridad->foto_url;
        $cvUrl = $autoridad->cv_url;

        $autoridad->delete();

        if ($fotoUrl && !$this->esUrlExterna($fotoUrl)) {
            Storage::disk('public')->delete($fotoUrl);
        }

        if ($cvUrl && !$this->esUrlExterna($cvUrl)) {
            Storage::disk('public')->delete($cvUrl);
        }

        return response()->json([
            'success' => true,
            'message' => 'Autoridad eliminada correctamente.',
        ]);
    }

    private function esUrlExterna(?string $ruta): bool
    {
        if (!$ruta) {
            return false;
        }

        return str_starts_with($ruta, 'http://') || str_starts_with($ruta, 'https://');
    }
}
