<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesYPermisosSeeder::class);

        User::factory()->conRol('admin')->create([
            'nombre_completo' => 'Admin de prueba',
            'email' => 'admin-seed@example.com',
        ]);
    }
}
