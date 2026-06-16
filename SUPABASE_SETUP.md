# Integración Supabase - ClassNest

## 1. Instalación de dependencias

```bash
npm install @supabase/supabase-js
```

## 2. Variables de entorno (.env o .env.local)

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Migración SQL

Ejecuta el archivo `supabase/migrations.sql` en Supabase SQL Editor.

## 4. Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Classes - user can view own" ON classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Classes - user can insert own" ON classes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Classes - user can update own" ON classes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Classes - user can delete own" ON classes FOR DELETE USING (auth.uid() = user_id);

-- Repite para: students, attendance, grades, schedule_blocks, diary_entries, activities
-- Usa: FOR SELECT/INSERT/UPDATE/DELETE WITH CHECK (auth.uid() = user_id)
```

## 5. Archivos creados

- `src/lib/supabase.ts` - Cliente configurado con tipos
- `supabase/migrations.sql` - Schema SQL completo
- `src/store/supabase-store.ts` - Store con Supabase integrado
- `src/components/LoginFormSupabase.tsx` - Login con Email/Password + Magic Link
- `src/hooks/useSupabaseSession.ts` - Hook para proteger rutas

## 6. Instrucciones para probar

1. Crear proyecto en https://supabase.com
2. Ejecutar migración SQL en SQL Editor
3. Configurar variables de entorno
4. Habilitar RLS y políticas
5. Ejecutar: `npm run dev`
6. Registrar usuario -> verificar email
7. Iniciar sesión con email/password o Magic Link