# Analisis tecnico completo - ClassNest
Fecha del analisis: 2026-06-17

## 1. Descripcion general

Aplicacion hibrida para gestion academica (clases, estudiantes, asistencia, calificaciones, periodos y reportes). Usa Supabase para auth y datos, y Capacitor para Android.

## 2. Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 + CSS variables
- Zustand 5
- Radix UI + Lucide icons
- Supabase (auth + PostgreSQL)
- Capacitor 8 (Android)
- xlsx

## 3. Modulos

### 3.1 Autenticacion
- Login con correo/contrasenya.
- Magic link.
- Registro en /register.
- Sesion persistida por Supabase Auth.

### 3.2 Clases y estudiantes
- CRUD clases y alumnos.
- Importar/exportar alumnos desde/hacia Excel.

### 3.3 Asistencia
- Estados: presente, ausente, ausencia justificada, retraso justificado, retirado.
- Modo tabla y modo llamar lista paso a paso.

### 3.4 Actividades y periodos
- Actividades por clase y periodo.
- Cierre de periodos.

### 3.5 Calificaciones
- Notas por alumno y actividad.
- Promedio, aprobados/reprobados, exportacion Excel.
- Guardado optimista con cola para evitar condiciones de carrera.

### 3.6 Diario, horario y dashboard
- Diario de clase por fecha.
- Horario semanal.
- Dashboard con clases del dia y estadisticas.

### 3.7 Actualizador de APK
- Consulta Supabase para nuevas versiones.
- Solo en Android.
- Compara versiones semver simples.

## 4. Modelo de datos

| Entidad | Campos clave |
|---------|------------|
| Class | id, name, subject, grade, color |
| Student | id, classId, name, lastName |
| Attendance | id, classId, studentId, date, status, comment |
| Activity | id, classId, periodId, name, type, date, maxScore |
| Period | id, classId, periodNumber (1-4), name, startDate, endDate, isClosed |
| Grade | id, activityId, studentId, score, comment |

(Para detalles adicionales, ver src/types/index.ts y src/lib/supabase.ts.)

## 5. Arquitectura

- Store unico Zustand (app.ts) con mappers snake_case/camelCase.
- Estilos inline por componente.
- useApp como wrapper tipado.

## 6. Fortalezas

1. Flujo academico completo: clases, alumnos, asistencia, calificaciones, periodos y reportes.
2. Stack moderno y mantenido.
3. Multiplataforma real (web + Android).
4. Buen manejo de concurrencia en calificaciones.
5. UX cuidada en modo llamar lista.
6. Sistema de temas claro/oscuro/sistema.
7. Exportacion Excel con estilos y multiples hojas.

## 7. Vulnerabilidades y problemas

### Seguridad
- RLS depende de configuracion externa no versionada.
- Magic link sin restricciones de rate-limit visibles.
- Validacion debil al importar desde Excel.

### Estabilidad
- Calculo de promedio normaliza a escala fija, lo que distorsiona resultados si los maximos de actividad varian mucho.
- Comparacion de fechas en modo string, sensible a zonas horarias.
- IDs temporales sin limpieza explicita en recargas.
- Sin reintentos en mutaciones criticas de red.

### Rendimiento
- Archivos con estilos inline muy extensos.
- Calculos repetidos en render sin memoizacion.
- Sin feedback visual de carga inicial.

### Mantenibilidad
- Store monolico, dificil de escalar.
- Listas de ramas y opciones hardcodeadas.
- Uso de confirm() nativo rompe la coherencia visual.

## 8. Sugerencias priorizadas

### Alta
1. Ajustar la formula de calificaciones para que refleje la escala real.
2. Agregar migraciones SQL versionadas de Supabase.
3. Adoptar timezone consistente (UTC en datos, locales solo en vista).

### Media
4. Migrar estilos inline a componentes reutilizables.
5. Implementar reintentos en mutaciones criticas.
6. Reorganizar Zustand en slices y hooks mas chicos.
7. Mejorar el parser de Excel para importacion.

### Baja
8. Reemplazar window.confirm por AlertDialog de Radix UI.
9. Agregar skeletons y feedback de carga.
10. Tests minimos con Vitest.
