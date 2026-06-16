import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, ClipboardCheck, CalendarDays, BookOpen, ArrowRight, Clock } from 'lucide-react';

const getTodayClasses = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return dayOfWeek;
};

const getQuickLinks = () => [
  { id: 'classes', icon: GraduationCap, label: 'Mis Clases', bg: 'var(--accent-primary)' },
  { id: 'students', icon: Users, label: 'Alumnos', bg: 'var(--success)' },
  { id: 'attendance', icon: ClipboardCheck, label: 'Asistencia', bg: 'var(--warning)' },
  { id: 'schedule', icon: CalendarDays, label: 'Horario', bg: '#8b5cf6' },
  { id: 'diary', icon: BookOpen, label: 'Diario', bg: 'var(--danger)' },
];

export const Dashboard = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = getTodayClasses();

  const totalStudents = state.students.length;
  const totalClasses = state.classes.length;
  const todayAttendances = state.attendance.filter(a => a.date === today);

  const presentCount = todayAttendances.filter(a => a.status === 'presente').length;
  const absentCount = todayAttendances.filter(a => a.status === 'ausente').length;

  const getDisplayName = () => {
    if (!state.user?.name || state.user.name === 'Profesor') return 'Profesor';
    const parts = state.user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0] || 'Profesor';
  };

  const displayName = getDisplayName();

  const todayClasses = state.schedule
    .filter(block => block.day === dayOfWeek)
    .map(block => state.classes.find(c => c.id === block.classId))
    .filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ 
          background: 'linear-gradient(to right, var(--accent-primary), var(--accent-hover))', 
          borderRadius: '16px', 
          padding: '32px', 
          color: 'white',
          flex: 1,
          minWidth: '280px'
        }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>
            ¡Bienvenido, {displayName}!
          </h1>
          <p style={{ opacity: 0.8 }}>Aquí está el resumen de hoy</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} color="var(--accent-primary)" aria-hidden="true" />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Clases</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalClasses}</p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="var(--success)" aria-hidden="true" />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Alumnos</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalStudents}</p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardCheck size={24} color="var(--success)" aria-hidden="true" />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Presentes Hoy</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{presentCount}</p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="var(--danger)" aria-hidden="true" />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Ausentes Hoy</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{absentCount}</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Clases de Hoy</h2>
        {todayClasses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {todayClasses.map((cls, idx) => cls && (
              <div key={idx} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{cls.name}</p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{cls.subject}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No hay clases programadas para hoy</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        {getQuickLinks().map(link => {
          const Icon = link.icon;
          return (
            <div key={link.id} onClick={() => navigate('/' + link.id)} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', background: link.bg }}>
                <Icon size={24} color="white" aria-hidden="true" />
              </div>
              <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{link.label}</p>
              <ArrowRight size={16} color="var(--text-muted)" style={{ marginTop: '8px' }} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
