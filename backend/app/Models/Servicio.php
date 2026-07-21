<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Servicio extends Model
{
    protected $table = 'servicios';

    protected $primaryKey = 'idservicio';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion_corta',
        'descripcion_larga',
        'icono',
        'url_servicio',
        'requiere_autenticacion',
        'idcategoria',
        'orden',
        'activo',
        // Campos extendidos del modal público
        'correo_contacto',
        'texto_accion',
        'orientacion',
        'casos_uso',
        'consejo',
        'seccion_relacionada',
        'label_seccion',
    ];

    protected $casts = [
        'requiere_autenticacion' => 'boolean',
        'activo'                 => 'boolean',
        'orden'                  => 'integer',
        'idcategoria'            => 'integer',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'idcategoria', 'idcategoria');
    }
}
