// Exporta el store de Supabase como store principal
// Mantiene la misma API que el store original con localStorage

export { 
  useAppStore, 
  useApp, 
  AppProvider,
  type AppContextType 
} from './supabase-store';