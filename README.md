# PortalWebDSTI

Proyecto web con backend en Laravel y frontend en React + Vite.

## Estructura principal

- `backend/` - aplicación Laravel (PHP 8.3, Laravel 13)
- `frontend/` - aplicación React con Vite
- `package.json` - raíz del proyecto, contiene dependencias globales mínimas

## Qué hace este proyecto

Este repositorio combina un backend Laravel con un frontend React. El backend ofrece la API y la lógica de negocio, mientras que el frontend consume esas APIs y sirve la interfaz de usuario.

## Requisitos

- PHP 8.3
- Composer
- Node.js y npm
- Laravel CLI opcional

## Instalación y puesta en marcha

### Backend

1. Ir a `backend/`
2. Instalar dependencias PHP:
   ```bash
   cd backend
   composer install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Crear el esquema de base de datos (tablas, triggers de auditoría, llaves foráneas):
   ```bash
   php artisan migrate
   ```
   > El esquema completo vive en `database/schema/mysql-schema.sql` (generado con
   > `php artisan schema:dump`). Laravel lo carga automáticamente antes de correr
   > cualquier migración nueva — así una base de datos vacía queda idéntica a la
   > actual sin depender de un dump externo. Si cambias el esquema directamente en
   > la BD (fuera de una migración), vuelve a correr `php artisan schema:dump`
   > para mantener este archivo al día.
5. Instalar dependencias JS para Laravel/Vite:
   ```bash
   npm install
   ```
6. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

> El comando `npm run dev` en `backend/` activa Vite junto a Laravel si la configuración local lo requiere.

### Frontend

1. Ir a `frontend/`
2. Instalar dependencias JavaScript:
   ```bash
   cd frontend
   npm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

## Scripts útiles

### Backend

- `composer install` - instala dependencias PHP
- `php artisan serve` - inicia el servidor Laravel
- `npm run dev` - inicia Vite en modo desarrollo
- `npm run build` - construye activos de frontend para Laravel
- `npm run test` - ejecuta pruebas de Laravel

### Frontend

- `npm run dev` - inicia la app React en modo desarrollo
- `npm run build` - genera la versión de producción
- `npm run lint` - ejecuta ESLint
- `npm run preview` - sirve la build localmente

## Documentación del proyecto

- Mantén este `README.md` actualizado con cambios importantes.
- Añade comentarios en el código donde la lógica sea compleja o haya decisiones de diseño importantes.
- Usa mensajes de commit claros:
  - qué se cambió
  - por qué se cambió
  - si corresponde, referencia tickets o issues

## Notas adicionales

- `backend/README.md` y `frontend/README.md` también existen, pero contienen plantillas genéricas.
- Puedes ampliar la documentación con un directorio `docs/` para describir reglas de negocio, rutas de API o arquitectura interna.
