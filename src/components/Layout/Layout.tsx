import { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardCheck, CalendarDays, CalendarRange, BookOpen, Sun, Moon, LogOut, GraduationCap, Menu, X, FileText, Monitor } from 'lucide-react';
import { useAppUpdate } from '../../hooks/useAppUpdate';
import { AppUpdateDialog } from '../AppUpdateDialog';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Ir al Dashboard' },
  { id: 'classes', icon: GraduationCap, label: 'Mis Clases', ariaLabel: 'Ver mis clases' },
  { id: 'students', icon: Users, label: 'Alumnos', ariaLabel: 'Gestionar alumnos' },
  { id: 'attendance', icon: ClipboardCheck, label: 'Asistencia', ariaLabel: 'Control de asistencia' },
  { id: 'grades', icon: FileText, label: 'Notas', ariaLabel: 'Gestionar calificaciones' },
  { id: 'periods', icon: CalendarRange, label: 'Periodos', ariaLabel: 'Gestionar periodos' },
  { id: 'schedule', icon: CalendarDays, label: 'Horario', ariaLabel: 'Ver horario' },
  { id: 'diary', icon: BookOpen, label: 'Diario', ariaLabel: 'Diario de clases' },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
   const { state, logout, toggleTheme } = useApp();
   const location = useLocation();
   const navigate = useNavigate();
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [isMobile, setIsMobile] = useState(false);
   
   const {
    updateAvailable,
    updateInfo,
    downloadUpdate,
    dismissUpdate,
    isMandatoryBlocked,
  } = useAppUpdate();

  const currentPage = location.pathname.slice(1) || 'dashboard';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navTo = (page: string) => {
    navigate('/' + page, { replace: true });
    setSidebarOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 50,
            padding: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sidebarOpen ? <X size={24} color="var(--text-primary)" /> : <Menu size={24} color="var(--text-primary)" />}
        </button>
      )}

      <aside
        aria-label="Panel de navegación principal"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isMobile ? '260px' : 'var(--sidebar-width)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'transform 0.3s ease',
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
              <path d="M22 10v6"></path>
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>ClassNest</span>
        </div>

        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navTo(item.id)}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={toggleTheme} 
            aria-label="Cambiar tema"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            {state.theme === 'dark' ? <Sun size={20} /> : state.theme === 'system' ? <Monitor size={20} /> : <Moon size={20} />}
            {state.theme === 'dark' ? 'Modo Claro' : state.theme === 'system' ? 'Sistema' : 'Modo Oscuro'}
          </button>
          <button 
            onClick={logout} 
            aria-label="Cerrar sesión"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            <LogOut size={20} aria-hidden="true" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          aria-label="Cerrar menú"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 30,
          }}
        />
      )}

      <main 
        style={{ 
          marginLeft: isMobile ? '0px' : 'var(--sidebar-width)', 
          padding: isMobile ? '16px' : '32px',
          paddingTop: isMobile ? '72px' : '32px',
        }}
      >
        {children}
      </main>

      {updateInfo && (
        <AppUpdateDialog
          open={updateAvailable}
          onOpenChange={dismissUpdate}
          onDownload={downloadUpdate}
          updateInfo={{
            version: updateInfo.version,
            build: updateInfo.build,
            changelog: updateInfo.changelog,
            mandatory: updateInfo.mandatory,
          }}
          isMandatoryBlocked={isMandatoryBlocked}
          daysRemaining={3}
        />
      )}
    </div>
  );
};