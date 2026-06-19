# ClassNest

![React](https://img.shields.io/badge/React-19.2-black?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-~6.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.2-06b6d4?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-2.108-green?logo=supabase)
![Capacitor](https://img.shields.io/badge/Capacitor-8.1-114EFF?logo=capacitor)

> Sistema de gestión académica híbrido para control de clases, estudiantes, asistencia, calificaciones y reportes. Optimizado para instituciones educativas y docentes.

## Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Desarrollo](#desarrollo)
- [Compilación Android](#compilación-android)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Sistema de Actualizaciones](#sistema-de-actualizaciones)
- [Arquitectura](#arquitectura)
- [Seguridad](#seguridad)

## Características

- **Autenticación segura** — Login con correo/contraseña o magic link mediante Supabase Auth.
- **Gestión de clases** — CRUD completo de clases/grupos con nombre, materia y grado.
- **Gestión de estudiantes** — Administración de alumnos con importación y exportación masiva desde/hacia Excel.
- **Control de asistencia** — Registro diario con estados: presente, ausente, ausencia justificada, retraso justificado y retirado.
- **Modo llamar lista** — Flujo paso a paso con scroll automático para toma de asistencia en aula.
- **Actividades académicas** — Categorización por tipo: tarea, examen, proyecto, participación, otro.
- **Calificaciones** — Cálculo automático de promedio en escala 10-50, mínimo aprobatorio 33, promedios por periodo y acumulado del año.
- **Periodos académicos** — Administración de hasta 4 periodos por clase con detección automática del periodo activo.
- **Horarios** — Bloques de horario semanal por clase.
- **Diario de clases** — Registro de bitácora por fecha y clase.
- **Reportes en Excel** — Exportación de calificaciones, asistencia y resúmenes con formato profesional.
- **Sistema de temas** — Modo claro, oscuro y automático según preferencia del sistema.
- **Actualizador de APK** — Sistema automático de actualizaciones con periodo de gracia de 3 días para actualizaciones opcionales.
- **Multiplataforma** — Web (Vite + React Router) y Android (Capacitor).

## Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Frontend | React + TypeScript | 19.2 / ~6.0 |
| Bundler | Vite | 8.0 |
| Estilos | Tailwind CSS + CSS Variables | v4.2 |
| Estado | Zustand | 5.0 |
| UI Components | Radix UI + Lucide Icons | - |
| Backend | Supabase (PostgreSQL + Auth) | 2.108 |
| Mobile | Capacitor Android | 8.1 |
| Reportes | SheetJS (xlsx) | 0.18.5 |
| Routing | React Router | 7.14 |
| Notificaciones | Sonner | 2.0.7 |

## Requisitos Previos

- Node.js >= 18
- npm o yarn
- Cuenta y proyecto en Supabase
- Android Studio (opcional, para compilar APK)

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Sistema de Actualizaciones

ClassNest incluye un sistema nativo de actualización de APK:

- Consulta automática a Supabase al iniciar la app
- Comparación por número de build (no depende de strings de versión)
- Periodo de gracia de 3 días para actualizaciones opcionales
- Actualizaciones obligatorias bloquean la app hasta instalar
- Descarga directa mediante Capacitor Browser

## Arquitectura

```
classnest/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Layout/       # Layout principal + navegación
│   │   ├── AppUpdateDialog.tsx
│   │   └── Onboarding.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAppUpdate.ts
│   │   └── useSupabaseSession.ts
│   ├── lib/              # Configuración Supabase
│   ├── pages/            # Vistas principales
│   │   ├── Attendance/   # Control de asistencia
│   │   ├── Classes/      # Gestión de clases
│   │   ├── Dashboard/    # Panel principal
│   │   ├── Diary/        # Diario de clases
│   │   ├── Grades/       # Calificaciones
│   │   ├── Periods/      # Periodos académicos
│   │   ├── Schedule/     # Horarios
│   │   └── Students/     # Gestión de estudiantes
│   ├── store/            # Estado global (Zustand)
│   │   └── supabase-store.ts
│   └── types/            # Definiciones TypeScript
├── android/              # Proyecto Android (Capacitor)
├── supabase/             # Migraciones SQL
└── public/               # Recursos estáticos
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | Linter ESLint |
| `npm run preview` | Preview del build |
| `npx cap sync android` | Sincronizar con Android |
| `npx cap open android` | Abrir en Android Studio |

## Roadmap

- [ ] Sincronización en tiempo real (Supabase Realtime)
- [ ] Roles de usuario (profesor / administrador / estudiante)
- [ ] Notificaciones push nativas
- [ ] Modo offline con cola de sincronización
- [ ] Analytics y reportes avanzados

## Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.
