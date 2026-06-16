## Plan: Mejora de la App Classnest

Resumir: Abordar problemas críticos de seguridad, rendimiento y mantenibilidad en la aplicación React, priorizando autenticación, consistencia de estilos y optimizaciones de código.

**Pasos**
1. **Fase 1: Correcciones de Seguridad** - Implementar autenticación real y proteger datos en localStorage.
   - Agregar validación de credenciales en el backend (o simular).
   - Encriptar datos sensibles en localStorage.
   - Implementar control de acceso basado en roles.
2. **Fase 2: Refactorización de Código** - Eliminar duplicaciones y mejorar arquitectura.
   - Extraer estilos inline a Tailwind consistente.
   - Crear componentes reutilizables (StatusBadge, FormCard).
   - Centralizar constantes en src/config/constants.ts.
   - Separar lógica de App.tsx en componentes dedicados.
3. **Fase 3: Optimizaciones de Rendimiento** - Agregar memoización y optimizaciones.
   - Usar useCallback y useMemo en funciones y cálculos.
   - Implementar carga diferida (lazy loading) para rutas.
   - Optimizar actualizaciones de estado para evitar re-renders innecesarios.
4. **Fase 4: Mejoras de TypeScript y Validación** - Fortalecer seguridad de tipos y validación.
   - Reemplazar 'as any' con validaciones apropiadas.
   - Agregar checks de null y bounds.
   - Mejorar validación de formularios (emails, puntajes).
5. **Fase 5: Accesibilidad y UX** - Hacer la app más usable.
   - Agregar etiquetas ARIA y gestión de foco.
   - Implementar navegación por teclado.
   - Agregar estados de carga y manejo de errores.
6. **Fase 6: Manejo de Datos y Arquitectura** - Mejorar importación/exportación y estado.
   - Agregar validación robusta para archivos Excel.
   - Refactorizar AppContext en contextos separados.
   - Agregar límites de error y recuperación.

**Archivos relevantes**
- [src/App.tsx](src/App.tsx) — Refactorizar lógica de login y routing.
- [src/pages/Login/Login.tsx](src/pages/Login/Login.tsx) — Mejorar autenticación.
- [src/store/AppContext.tsx](src/store/AppContext.tsx) — Dividir en contextos más pequeños.
- [src/types/index.ts](src/types/index.ts) — Fortalecer definiciones de tipos.
- [src/pages/Grades/Grades.tsx](src/pages/Grades/Grades.tsx) — Optimizar cálculos y validación.
- [src/pages/Attendance/Attendance.tsx](src/pages/Attendance/Attendance.tsx) — Agregar checks de bounds.
- [src/config/constants.ts](src/config/constants.ts) — Nuevo archivo para constantes.

**Verificación**
1. Ejecutar ESLint y TypeScript para errores.
2. Probar autenticación y acceso a datos.
3. Verificar rendimiento con React DevTools Profiler.
4. Probar accesibilidad con herramientas como axe-core.
5. Validar importación/exportación de datos con archivos de prueba.

**Decisiones**
- Adoptar Tailwind CSS para estilos consistentes en lugar de estilos inline.
- Usar Zustand para gestión de estado en lugar de Context API monolítico.
- Priorizar seguridad antes de otras mejoras.

**Consideraciones adicionales**
1. ¿Implementar backend real o simular autenticación? (Recomiendo simular inicialmente para eficiencia).