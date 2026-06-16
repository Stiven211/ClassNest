import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import { Mic, SkipForward, SkipBack, CheckCircle, XCircle, AlertCircle, Clock, Trash2, FileSpreadsheet } from 'lucide-react';
import type { AttendanceStatus } from '../../types';
import { toast } from 'sonner';
import type { CSSProperties } from 'react';

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  presente: { label: 'Presente', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle },
  ausente: { label: 'Ausente', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
  ausencia_justificada: { label: 'Justificada', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', icon: AlertCircle },
  retraso_justificado: { label: 'Retraso', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', icon: Clock },
  retirado: { label: 'Retirado', color: '#9333ea', bgColor: 'rgba(147, 51, 234, 0.15)', icon: Trash2 },
};

const NEEDS_COMMENT_STATUSES: AttendanceStatus[] = ['ausencia_justificada', 'retraso_justificado', 'retirado'];

const staggerDelay = (index: number) => ({
  animationDelay: `${index * 50}ms`,
});

export const Attendance = () => {
  const { state, setAttendance, getAttendanceByDateAndClass, getStudentsByClass } = useApp();
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [callingMode, setCallingMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [studentComments, setStudentComments] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<{studentId: string; status: AttendanceStatus} | null>(null);
  const studentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const students = selectedClassId ? getStudentsByClass(selectedClassId) : [];
  const attendances = getAttendanceByDateAndClass(selectedDate, selectedClassId);
  const selectedClass = state.classes.find(c => c.id === selectedClassId);

  const needsComment = (status: AttendanceStatus): boolean => {
    return NEEDS_COMMENT_STATUSES.includes(status);
  };

  useEffect(() => {
    if (callingMode && studentRefs.current[currentIndex] && !pendingStatus) {
      studentRefs.current[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [callingMode, currentIndex, pendingStatus]);

  const getAttendance = (studentId: string) => {
    return attendances.find(a => a.studentId === studentId);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus): void => {
    const studentAttendance = getAttendance(studentId);
    const currentComment = studentAttendance?.comment || studentComments[studentId] || '';
    
    if (needsComment(status) && !pendingStatus) {
      setPendingStatus({ studentId, status });
    } else {
      submitAttendance(studentId, status, pendingStatus ? studentComments[studentId] : currentComment);
    }
  };

  const submitAttendance = (studentId: string, status: AttendanceStatus, comment?: string): void => {
    setSaving(true);
    
    setAttendance({
      classId: selectedClassId,
      studentId,
      date: selectedDate,
      status,
      comment: comment?.trim() || undefined,
    });
    
    setSaving(false);
    setPendingStatus(null);
    setStudentComments(prev => ({ ...prev, [studentId]: '' }));

    toast.success(`Asistencia guardada para ${students.find(s => s.id === studentId)?.name}`);

    if (callingMode && currentIndex < students.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    } else if (callingMode && currentIndex === students.length - 1) {
      setCallingMode(false);
      toast.success(`✅ Llamada de lista completada (${students.length} estudiantes)`);
    }
  };

  const handleConfirmWithComment = (): void => {
    if (pendingStatus) {
      const comment = studentComments[pendingStatus.studentId]?.trim();
      if (!comment) {
        toast.error('El comentario es requerido para este estado');
        return;
      }
      submitAttendance(pendingStatus.studentId, pendingStatus.status, comment);
    }
  };

  const getDailyStats = () => {
    const dayAttendances = state.attendance.filter(
      a => a.date === selectedDate && a.classId === selectedClassId
    );
    
    const stats: Record<AttendanceStatus, number> = {
      presente: 0,
      ausente: 0,
      ausencia_justificada: 0,
      retraso_justificado: 0,
      retirado: 0,
    };

    dayAttendances.forEach(a => {
      stats[a.status]++;
    });

    return stats;
  };

  const dailyStats = selectedClassId ? getDailyStats() : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Asistencia
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Control de asistencia diaria
          </p>
        </div>

        {selectedClassId && students.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {callingMode ? (
              <>
                <button
                  onClick={() => {
                    setCallingMode(false);
                    setPendingStatus(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 24px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    transition: 'all 0.2s ease',
                  } as CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                  }}
                >
                  <XCircle size={20} />
                  Terminar Llamada
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setCallingMode(true);
                }}
                disabled={!selectedClassId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  background: selectedClassId 
                    ? 'linear-gradient(135deg, var(--accent-primary), #4f46e5)' 
                    : 'var(--bg-tertiary)',
                  color: selectedClassId ? 'white' : 'var(--text-muted)',
                  fontWeight: '600',
                  cursor: selectedClassId ? 'pointer' : 'not-allowed',
                  fontSize: '15px',
                  boxShadow: selectedClassId ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                } as CSSProperties}
                onMouseEnter={(e) => {
                  if (selectedClassId) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                }}
              >
                <Mic size={20} />
                Llamar Lista
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selector de Clase y Fecha */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '16px' 
      }}>
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid var(--border-color)' 
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--text-secondary)', 
            marginBottom: '8px' 
          }}>
            Clase
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              fontSize: '16px', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">Seleccionar clase...</option>
            {state.classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} — {cls.subject}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid var(--border-color)' 
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--text-secondary)', 
            marginBottom: '8px' 
          }}>
            Fecha
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              fontSize: '16px', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '16px',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {formatDate(selectedDate)}
          </p>
        </div>
      </div>

      {/* Mensaje sin clase seleccionada */}
      {!selectedClassId && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          padding: '60px 20px', 
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
            Selecciona una clase para ver la asistencia
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Elige una clase del selector superior para continuar
          </p>
        </div>
      )}

      {/* Barra de progreso en modo llamar lista */}
      {callingMode && students.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
          borderRadius: '16px', 
          padding: '20px', 
          color: 'white',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                style={{ 
                  padding: '8px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '10px', 
                  border: 'none', 
                  color: 'white', 
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', 
                  opacity: currentIndex === 0 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentIndex > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                <SkipBack size={20} />
              </button>
              
              <div>
                <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>
                  {currentIndex + 1} de {students.length} estudiantes
                </p>
                <p style={{ fontWeight: '700', fontSize: '18px', margin: 0 }}>
                  {students[currentIndex]?.name} {students[currentIndex]?.lastName}
                </p>
              </div>
              
              <button
                onClick={() => setCurrentIndex(Math.min(students.length - 1, currentIndex + 1))}
                disabled={currentIndex === students.length - 1}
                style={{ 
                  padding: '8px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '10px', 
                  border: 'none', 
                  color: 'white', 
                  cursor: currentIndex === students.length - 1 ? 'not-allowed' : 'pointer', 
                  opacity: currentIndex === students.length - 1 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentIndex < students.length - 1) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '9999px'
            }}>
              <Mic size={18} />
              <span style={{ fontWeight: '600' }}>Llamando Lista</span>
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '8px', 
            height: '8px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              background: 'white', 
              width: `${((currentIndex + 1) / students.length) * 100}%`,
              height: '100%',
              transition: 'width 0.3s ease',
              borderRadius: '8px'
            }} />
          </div>
        </div>
      )}

      {/* Panel de acción en modo llamar lista */}
      {callingMode && students.length > 0 && (
        <div style={{ 
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <p style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: 'var(--text-primary)', 
            marginBottom: '16px' 
          }}>
            Marcar asistencia para {students[currentIndex]?.name}:
          </p>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => students[currentIndex] && handleStatusChange(students[currentIndex].id, status as AttendanceStatus)}
                  disabled={!!pendingStatus || saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: pendingStatus || saving ? 'not-allowed' : 'pointer',
                    background: pendingStatus || saving 
                      ? 'var(--bg-tertiary)' 
                      : `${config.color}22`,
                    color: pendingStatus || saving ? 'var(--text-muted)' : config.color,
                    opacity: pendingStatus || saving ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    minWidth: '140px',
                  } as CSSProperties}
                  onMouseEnter={(e) => {
                    if (!pendingStatus && !saving) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Icon size={18} />
                  {config.label}
                </button>
              );
            })}
          </div>
          
          {pendingStatus && (
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              borderRadius: '12px', 
              padding: '20px', 
              marginTop: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text-primary)', 
                marginBottom: '12px' 
              }}>
                Agregar motivo para {statusConfig[pendingStatus.status].label}:
              </p>
              <input
                type="text"
                value={studentComments[pendingStatus.studentId] || ''}
                onChange={(e) => setStudentComments(prev => ({ ...prev, [pendingStatus.studentId]: e.target.value }))}
                placeholder="Escribe el motivo o descripción..."
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '15px', 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)',
                  outline: 'none',
                  marginBottom: '16px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setPendingStatus(null);
                    setStudentComments(prev => ({ ...prev, [pendingStatus!.studentId]: '' }));
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    fontWeight: '500' 
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmWithComment}
                  disabled={!studentComments[pendingStatus.studentId]?.trim()}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    background: studentComments[pendingStatus.studentId]?.trim() 
                      ? 'var(--accent-primary)' 
                      : 'var(--bg-tertiary)', 
                    color: studentComments[pendingStatus.studentId]?.trim() 
                      ? 'var(--accent-text)' 
                      : 'var(--text-muted)', 
                    cursor: studentComments[pendingStatus.studentId]?.trim() 
                      ? 'pointer' 
                      : 'not-allowed', 
                    fontWeight: '600' 
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de asistencia normal */}
      {selectedClassId && !callingMode && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '600', 
              color: 'var(--text-primary)' 
            }}>
              {selectedClass?.name} — {students.length} estudiantes
            </h2>
          </div>

          {students.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <AlertCircle size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                No hay estudiantes en esta clase
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Importa estudiantes desde la sección Alumnos
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                minWidth: '800px' 
              }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '14px 16px', 
                      textAlign: 'left', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '2px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      minWidth: '200px',
                    }}>
                      Estudiante
                    </th>
                    <th style={{ 
                      padding: '14px 16px', 
                      textAlign: 'left', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '2px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      minWidth: '250px',
                    }}>
                      Comentario
                    </th>
                    <th style={{ 
                      padding: '14px 16px', 
                      textAlign: 'center', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '2px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      minWidth: '300px',
                    }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const attendance = getAttendance(student.id);
                    const isSelected = attendance?.status && attendance.status !== 'ausente';

                    return (
                      <tr key={student.id} style={{
                        animation: 'fadeIn 0.3s ease forwards',
                        ...staggerDelay(index),
                      } as CSSProperties}>
                        <td style={{ 
                          padding: '16px', 
                          fontSize: '15px', 
                          color: 'var(--text-primary)',
                          borderBottom: '1px solid var(--border-color)',
                          fontWeight: '500',
                          background: 'var(--bg-secondary)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontWeight: '600', 
                              background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)', 
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              flexShrink: 0
                            }}>
                              {index + 1}
                            </div>
                            <span>{student.name} {student.lastName}</span>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '16px',
                          borderBottom: '1px solid var(--border-color)',
                        }}>
                          {(attendance?.status === 'ausencia_justificada' || 
                            attendance?.status === 'retraso_justificado' || 
                            attendance?.status === 'retirado') && (
                            <input
                              type="text"
                              value={studentComments[student.id] ?? attendance?.comment ?? ''}
                              onChange={(e) => setStudentComments(prev => ({ ...prev, [student.id]: e.target.value }))}
                              onBlur={(e) => {
                                if (e.target.value !== attendance?.comment) {
                                  setAttendance({
                                    classId: selectedClassId,
                                    studentId: student.id,
                                    date: selectedDate,
                                    status: attendance!.status,
                                    comment: e.target.value.trim() || undefined,
                                  });
                                  toast.success('Comentario actualizado');
                                }
                              }}
                              placeholder="Agregar comentario..."
                              style={{ 
                                width: '100%', 
                                padding: '10px 14px', 
                                borderRadius: '10px', 
                                border: '1px solid var(--border-color)', 
                                fontSize: '14px', 
                                background: 'var(--bg-tertiary)', 
                                color: 'var(--text-primary)',
                                outline: 'none',
                              }}
                            />
                          )}
                        </td>
                        <td style={{ 
                          padding: '16px', 
                          borderBottom: '1px solid var(--border-color)',
                        }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {Object.entries(statusConfig).map(([status, config]) => {
                              const Icon = config.icon;
                              const isActive = attendance?.status === status;
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(student.id, status as AttendanceStatus)}
                                  disabled={saving}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    background: isActive 
                                      ? `${config.color}22` 
                                      : 'var(--bg-tertiary)',
                                    color: isActive 
                                      ? config.color 
                                      : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    minWidth: '110px',
                                  } as CSSProperties}
                                  onMouseEnter={(e) => {
                                    if (!saving) {
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <Icon size={16} />
                                  {config.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas diarias */}
      {dailyStats && students.length > 0 && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          padding: '24px', 
          border: '1px solid var(--border-color)' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <FileSpreadsheet size={24} color="var(--accent-primary)" />
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              margin: 0 
            }}>
              Resumen Diario - {selectedClass?.name}
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '16px' 
          }}>
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                background: config.bgColor,
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  color: config.color,
                  marginBottom: '4px'
                }}>
                  {dailyStats[status as AttendanceStatus]}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: config.color,
                  fontWeight: '500'
                }}>
                  {config.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estilos globales para animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};