# ClassNest

ClassNest es una aplicación web/híbrida para la gestión académica de clases, estudiantes, asistencia, calificaciones, periodos académicos y reportes en Excel.

## Funcionalidades principales

- Inicio de sesión con Supabase.
- Gestión de clases y estudiantes.
- Importación y exportación de estudiantes desde Excel.
- Control de asistencia.
- Gestión de actividades y calificaciones.
- Escala de notas de 10 a 50.
- Promedio mínimo aprobatorio: 33.
- Periodos académicos.
- Promedio por periodo.
- Acumulado del año.
- Cálculo de nota necesaria para aprobar.
- Exportación de reportes en Excel.
- Soporte para APK mediante Capacitor Android.

## Requisitos

- Node.js 18 o superior.
- npm.
- Cuenta y proyecto en Supabase.
- Android Studio, opcional para generar APK.

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No subas el archivo `.env` a GitHub.

## Desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Capacitor Android

Instalar plataforma Android:

```bash
npm run cap:add:android
```

Sincronizar proyecto Android:

```bash
npm run cap:sync
```

Abrir proyecto en Android Studio:

```bash
npm run cap:open:android
```

## Vercel

Para desplegar en Vercel, configura estas variables de entorno:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Luego conecta el repositorio de GitHub y usa:

```txt
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

También debes agregar el dominio de Vercel en la configuración de Supabase Authentication.

## Seguridad

- No publiques contraseñas, service keys ni archivos `.env`.
- Usa políticas RLS en Supabase.
- Mantén separadas las variables públicas y privadas.
