<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enlaces_sistemas', function (Blueprint $table) {
            $table->unsignedInteger('idarchivo_manual')->nullable()->after('idestadooperativo');
            $table->unsignedInteger('idarchivo_documentacion')->nullable()->after('idarchivo_manual');

            $table->foreign('idarchivo_manual', 'fk_enlaces_sistemas_archivo_manual')
                ->references('idarchivo')->on('archivos')
                ->nullOnDelete();

            $table->foreign('idarchivo_documentacion', 'fk_enlaces_sistemas_archivo_documentacion')
                ->references('idarchivo')->on('archivos')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enlaces_sistemas', function (Blueprint $table) {
            $table->dropForeign('fk_enlaces_sistemas_archivo_manual');
            $table->dropForeign('fk_enlaces_sistemas_archivo_documentacion');
            $table->dropColumn(['idarchivo_manual', 'idarchivo_documentacion']);
        });
    }
};
