import { useState, type CSSProperties } from 'react';
import { useApp } from '../../store';
import { Plus, Trash2, Clock, CalendarDays, X, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const hourSlots = [
  { label: '6:30 AM', start: 6.5, end: 7 + 25/60 },
  { label: '7:25 AM', start: 7 + 25/60, end: 8 + 20/60 },
  { label: '8:20 AM', start: 8 + 20/60, end: 8 + 40/60, isBreak: true },
  { label: '8:40 AM', start: 8 + 40/60, end: 9 + 35/60 },
  { label: '9:35 AM', start: 9 + 35/60, end: 10 + 30/60 },
  { label: '10:30 AM', start: 10 + 30/60, end: 10 + 40/60, isBreak: true },
  { label: '10:40 AM', start: 10 + 40/60, end: 11 + 35/60 },
  { label: '11:35 AM', start: 11 + 35/60, end: 12 + 5/60 },
];

const breaks = [
  { startMinutes: 8 * 60 + 20, endMinutes: 8 * 60 + 40 },
  { startMinutes: 10 * 60 + 30, endMinutes: 10 * 60 + 40 },
];

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const durationOptions = [
  { label: '1 clase (55 min)', value: 55 },
  { label: '2 clases (110 min)', value: 110 },
  { label: '3 clases (165 min)', value: 165 },
];

const formatTime = (hour: number) => {
  const totalMinutes = Math.round(hour * 60);
  const h = Math.floor(totalMinutes / 60) % 12 || 12;
  const m = totalMinutes % 60;
  const period = Math.floor(totalMinutes / 60) >= 12 ? 'PM' : 'AM';
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
};

const classColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

const staggerDelay = (index: number) => ({
  animationDelay: `${index * 50}ms`,
});

const timeToMinutes = (hour: number) => hour * 60;

export const Schedule = () => {
  const { state, addScheduleBlock, removeScheduleBlock } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    day: '1',
    startHour: '6.5',
    duration: '55',
    room: '',
  });

  const scheduleBlocks = state.schedule;

  const getBlocksForDay = (day: number) => {
    return scheduleBlocks.filter(block => block.day === day);
  };

  const getClassForBlock = (block: { classId: string }) => {
    return state.classes.find(c => c.id === block.classId);
  };

  const getClassColor = (classId: string, index: number) => {
    const classIndex = state.classes.findIndex(c => c.id === classId);
    return classColors[(classIndex >= 0 ? classIndex : index) % classColors.length];
  };

  const hasOverlap = (day: number, startHour: number, duration: number, excludeId?: string) => {
    const startMinutes = timeToMinutes(startHour);
    const endMinutes = startMinutes + duration;
    
    return scheduleBlocks.some(block => {
      if (excludeId && block.id === excludeId) return false;
      if (block.day !== day) return false;
      const blockStartMinutes = timeToMinutes(block.startHour);
      const blockEndMinutes = timeToMinutes(block.endHour);
      return startMinutes < blockEndMinutes && endMinutes > blockStartMinutes;
    });
  };

  const isSlotBreak = (slot: { isBreak?: boolean }) => {
    return slot.isBreak === true;
  };

  const overlapsWithBreak = (startHour: number, duration: number) => {
    const startMinutes = timeToMinutes(startHour);
    const endMinutes = startMinutes + duration;
    
    for (const brk of breaks) {
      if (startMinutes < brk.endMinutes && endMinutes > brk.startMinutes) {
        if (!(endMinutes <= brk.startMinutes || startMinutes >= brk.endMinutes)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.classId) {
      toast.error('Selecciona una clase');
      return;
    }

    const day = parseInt(formData.day);
    const startHour = parseFloat(formData.startHour);
    const duration = parseFloat(formData.duration);
    const endHour = startHour + (duration / 60);
    const endMinutes = Math.round(endHour * 60);

    if (hasOverlap(day, startHour, duration)) {
      toast.error('Ya existe un bloque en ese horario. Elige otro horario.');
      return;
    }

    if (overlapsWithBreak(startHour, duration)) {
      toast.error('No se puede agregar una clase durante el descanso. Elige otro horario.');
      return;
    }

    if (endMinutes > 12.5 * 60 + 1) {
      toast.error('El horario debe terminar antes de las 12:30 PM');
      return;
    }

    addScheduleBlock({
      classId: formData.classId,
      day,
      startHour,
      endHour,
    });

    toast.success('Bloque agregado correctamente');
    setIsDialogOpen(false);
    setFormData({
      classId: '',
      day: '1',
      startHour: '6.5',
      duration: '55',
      room: '',
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    const block = scheduleBlocks.find(b => b.id === blockId);
    if (block && window.confirm('¿Eliminar este bloque del horario?')) {
      removeScheduleBlock(blockId);
      toast.success('Bloque eliminado correctamente');
    }
  };

  const renderGrid = () => {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                width: '120px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  Hora
                </div>
              </th>
              {days.map(day => (
                <th key={day} style={{ 
                  padding: '16px', 
                  textAlign: 'center', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourSlots.map((slot, index) => {
              const isBreakSlot = isSlotBreak(slot);

              return (
                <tr key={`${slot.label}-${index}`}>
                  <td style={{ 
                    padding: '16px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    background: isBreakSlot ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  }}>
                    {isBreakSlot ? 'Descanso' : slot.label}
                  </td>
                  {days.map((_day, dayIndex) => {
                    const dayNumber = dayIndex + 1;
                    
                    if (isBreakSlot) {
                      return (
                        <td key={`${dayNumber}-${slot.label}-${index}`} style={{ 
                          padding: '10px', 
                          borderBottom: '1px solid var(--border-color)',
                          background: 'var(--bg-tertiary)',
                          textAlign: 'center',
                        }}>
                          <span style={{ 
                            padding: '6px 12px', 
                            borderRadius: '9999px', 
                            background: 'var(--bg-secondary)', 
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}>
                            Hora de descanso
                          </span>
                        </td>
                      );
                    }

                    const blocksAtSlot = getBlocksForDay(dayNumber).filter(block => {
                      const blockStartMinutes = timeToMinutes(block.startHour);
                      const slotStartMinutes = timeToMinutes(slot.start);
                      return blockStartMinutes === slotStartMinutes;
                    });
                    
                    const block = blocksAtSlot[0];

                    return (
                      <td key={`${dayNumber}-${slot.label}`} style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        minHeight: '80px',
                        verticalAlign: 'top',
                        position: 'relative',
                      }}>
                        {block ? (
                          <div style={{ position: 'relative' }}>
                            <div
                              style={{
                                padding: '14px',
                                borderRadius: '12px',
                                background: getClassColor(block.classId, dayIndex),
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                animation: 'fadeIn 0.3s ease forwards',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <div>
                                <p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 4px 0' }}>
                                  {getClassForBlock(block)?.name || 'Clase'}
                                </p>
                                <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>
                                  {getClassForBlock(block)?.subject || ''}
                                </p>
                                <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>
                                  {formatTime(block.startHour)} - {formatTime(block.endHour)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveBlock(block.id)}
                                style={{
                                  alignSelf: 'flex-end',
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  background: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                                title="Eliminar bloque"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ minHeight: '80px', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Libre</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMobileList = () => {
    
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        {days.map((day, dayIndex) => {
          const blocksForDay = getBlocksForDay(dayIndex + 1);

          return (
            <div key={day} style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '16px', 
              border: '1px solid var(--border-color)', 
              padding: '16px' 
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--text-primary)' 
              }}>
                {day}
              </h3>
              {blocksForDay.length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)', 
                  border: '1px dashed var(--border-color)', 
                  borderRadius: '12px' 
                }}>
                  Sin bloques programados
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {blocksForDay.map((block, index) => {
                    const cls = getClassForBlock(block);
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '14px',
                          borderRadius: '12px',
                          background: `${getClassColor(block.classId, dayIndex)}15`,
                          border: `1px solid ${getClassColor(block.classId, dayIndex)}33`,
                          animation: 'fadeIn 0.3s ease forwards',
                          ...staggerDelay(index),
                        } as CSSProperties}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '12px', 
                            background: getClassColor(block.classId, dayIndex),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Clock size={20} color="white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                              {cls?.name || 'Clase'}
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                              {formatTime(block.startHour)} - {formatTime(block.endHour)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBlock(block.id)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#ef444422',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444433'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#ef444422'; }}
                          title="Eliminar bloque"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Mi Horario Semanal
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Organiza tus clases de Lunes a Viernes
          </p>
        </div>

        <button
          onClick={() => setIsDialogOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.2s ease',
          } as CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
          }}
        >
          <Plus size={20} />
          Agregar Bloque
        </button>
      </div>

      {/* Selector de Clase */}
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
          Clase Principal
        </label>
        <select
          value={state.classes[0]?.id || ''}
          onChange={(e) => {
            const classId = e.target.value;
            const updated = state.classes.find(c => c.id === classId);
            if (updated) {
              toast.success(`Clase seleccionada: ${updated.name}`);
            }
          }}
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

      {/* Resumen de bloques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          padding: '20px', 
          border: '1px solid var(--border-color)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CalendarDays size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Total Bloques</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {scheduleBlocks.length}
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          padding: '20px', 
          border: '1px solid var(--border-color)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: '#10b981',
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Días con Horario</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', margin: 0 }}>
                {new Set(scheduleBlocks.map(block => block.day)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Semanal */}
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
            Lunes a Viernes
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '14px',
            margin: 0
          }}>
            6:30 AM - 12:30 PM | Descansos: 8:20-8:40 y 10:30-10:40
          </p>
        </div>

        <div className="hidden md:block">
          {renderGrid()}
        </div>
        <div className="md:hidden">
          {renderMobileList()}
        </div>
      </div>

      {/* Modal: Agregar Bloque */}
      {isDialogOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.2s ease forwards',
          } as CSSProperties}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                Agregar Bloque de Clase
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Clase
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">Selecciona una clase</option>
                  {state.classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Día de la semana
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {days.map((day, idx) => (
                    <option key={idx} value={(idx + 1).toString()}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Hora de inicio
                </label>
                <select
                  value={formData.startHour}
                  onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {hourSlots.filter(slot => !slot.isBreak).map(slot => (
                    <option key={slot.label} value={slot.start.toString()}>{slot.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Duración
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value.toString()}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Aula / Salón (opcional)
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Ej: Aula 101"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {formData.classId && hasOverlap(
                parseInt(formData.day),
                parseFloat(formData.startHour),
                parseFloat(formData.duration)
              ) && (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: '#ef444422', 
                  color: '#ef4444', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <AlertCircle size={18} />
                  Este horario se solapa con otro bloque existente
                </div>
              )}
              {formData.classId && overlapsWithBreak(
                parseFloat(formData.startHour),
                parseFloat(formData.duration)
              ) && (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: '#ef444422', 
                  color: '#ef4444', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <AlertCircle size={18} />
                  Este horario se solapa con un descanso
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formData.classId || hasOverlap(
                    parseInt(formData.day),
                    parseFloat(formData.startHour),
                    parseFloat(formData.duration)
                  ) || overlapsWithBreak(
                    parseFloat(formData.startHour),
                    parseFloat(formData.duration)
                  )}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: formData.classId && !hasOverlap(
                      parseInt(formData.day),
                      parseFloat(formData.startHour),
                      parseFloat(formData.duration)
                    ) && !overlapsWithBreak(
                      parseFloat(formData.startHour),
                      parseFloat(formData.duration)
                    )
                      ? 'var(--accent-primary)' 
                      : 'var(--bg-tertiary)',
                    color: formData.classId && !hasOverlap(
                      parseInt(formData.day),
                      parseFloat(formData.startHour),
                      parseFloat(formData.duration)
                    ) && !overlapsWithBreak(
                      parseFloat(formData.startHour),
                      parseFloat(formData.duration)
                    )
                      ? 'var(--accent-text)' 
                      : 'var(--text-muted)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: formData.classId && !hasOverlap(
                      parseInt(formData.day),
                      parseFloat(formData.startHour),
                      parseFloat(formData.duration)
                    ) && !overlapsWithBreak(
                      parseFloat(formData.startHour),
                      parseFloat(formData.duration)
                    )
                      ? 'pointer' 
                      : 'not-allowed',
                  }}
                >
                  Agregar Bloque
                </button>
              </div>
            </form>
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