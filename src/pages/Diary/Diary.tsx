import { useState, useMemo } from 'react';
import { useApp } from '../../store';
import { Plus, BookOpen, Search, Edit2, Trash2, Calendar, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { DiaryEntry } from '../../types';
import type { CSSProperties } from 'react';

const staggerDelay = (index: number) => ({
  animationDelay: `${index * 50}ms`,
});

export const Diary = () => {
  const { state, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredEntries = useMemo(() => {
    let entries = state.diaryEntries;
    
    if (selectedClassId) {
      entries = entries.filter(e => e.classId === selectedClassId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(e => 
        (e.title || '').toLowerCase().includes(term) || 
        e.content.toLowerCase().includes(term)
      );
    }
    
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [state.diaryEntries, selectedClassId, searchTerm]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('El contenido es requerido');
      return;
    }
    if (!selectedClassId) {
      toast.error('Selecciona una clase');
      return;
    }

    if (editingEntry) {
      updateDiaryEntry(editingEntry.id, {
        classId: selectedClassId,
        date: selectedDate,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      toast.success('Entrada actualizada correctamente');
    } else {
      addDiaryEntry({
        classId: selectedClassId,
        date: selectedDate,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      toast.success('Entrada guardada correctamente');
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setSelectedClassId(entry.classId);
    setSelectedDate(entry.date);
    setTitle(entry.title || '');
    setContent(entry.content);
    setIsModalOpen(true);
  };

  const handleDelete = (entry: DiaryEntry) => {
    if (window.confirm(`¿Eliminar la entrada del ${formatDateTime(entry.date)}?`)) {
      deleteDiaryEntry(entry.id);
      toast.success('Entrada eliminada');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
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
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <BookOpen size={32} color="var(--accent-primary)" />
            Diario de Clase
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Anotaciones y notas diarias de tus clases
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!state.classes.length}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            borderRadius: '16px',
            border: 'none',
            background: state.classes.length 
              ? 'linear-gradient(135deg, var(--accent-primary), #4f46e5)' 
              : 'var(--bg-tertiary)',
            color: 'white',
            fontWeight: '600',
            cursor: state.classes.length ? 'pointer' : 'not-allowed',
            fontSize: '15px',
            boxShadow: state.classes.length 
              ? '0 4px 12px rgba(99, 102, 241, 0.25)' 
              : 'none',
            transition: 'all 0.2s ease',
            minWidth: '180px',
          } as CSSProperties}
          onMouseEnter={(e) => {
            if (state.classes.length) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
          }}
        >
          <Plus size={20} />
          Nueva Anotación
        </button>
      </div>

      {/* Filtros */}
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
            display: 'flex', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--text-secondary)', 
            marginBottom: '8px',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Tag size={16} />
            Filtrar por Clase
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              fontSize: '16px', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">Todas las clases</option>
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
            Buscar en entradas
          </label>
          <div style={{ position: 'relative' }}>
            <Search 
              size={18} 
              color="var(--text-muted)" 
              style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none' 
              }} 
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título o contenido..."
              style={{ 
                width: '100%', 
                padding: '12px 16px 12px 44px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                fontSize: '16px',
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Entradas */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {filteredEntries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredEntries.map((entry, index) => {
              const entryClass = state.classes.find(c => c.id === entry.classId);
              return (
                <div 
                  key={entry.id} 
                  style={{ 
                    padding: '24px', 
                    animation: 'fadeIn 0.4s ease forwards',
                    ...staggerDelay(index),
                    borderBottom: index < filteredEntries.length - 1 ? '1px solid var(--border-color)' : 'none',
                  } as CSSProperties}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <BookOpen size={20} color="white" />
                      </div>
                      <div>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {entryClass?.name || 'Clase eliminada'}
                          {entry.title && (
                            <>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: '500', 
                                color: 'var(--text-secondary)',
                                padding: '4px 12px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '8px'
                              }}>
                                {entry.title}
                              </span>
                            </>
                          )}
                        </h3>
                        <p style={{ 
                          margin: '4px 0 0 0', 
                          fontSize: '14px', 
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Calendar size={14} />
                          {formatDateTime(entry.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                        } as CSSProperties}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--accent-primary)';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#ef444422',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                        } as CSSProperties}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef444433';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ef444422';
                        }}
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: 0, 
                    fontSize: '15px', 
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {entry.content}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            padding: '80px 20px', 
            textAlign: 'center' 
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'var(--bg-tertiary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <BookOpen size={48} color="var(--text-muted)" />
            </div>
            <p style={{ 
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {searchTerm || selectedClassId ? 'No se encontraron entradas' : 'Aún no hay entradas'}
            </p>
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '14px',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              {searchTerm || selectedClassId 
                ? 'Intenta con otros filtros o términos de búsqueda' 
                : 'Crea tu primera anotación usando el botón "Nueva Anotación"'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 100,
            padding: '20px'
          } as CSSProperties}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div 
            style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '20px', 
              padding: '32px', 
              width: '100%', 
              maxWidth: '560px',
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'fadeIn 0.3s ease'
            } as CSSProperties}
          >
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              margin: '0 0 24px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FileText size={24} color="var(--accent-primary)" />
              {editingEntry ? 'Editar Entrada' : 'Nueva Entrada'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'flex', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '8px',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Tag size={16} />
                  Clase
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required
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

              <div>
                <label style={{ 
                  display: 'flex', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '8px',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Calendar size={16} />
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
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

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '8px'
                }}>
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Tema de hoy, Tarea asignada..."
                  maxLength={100}
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
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-muted)', 
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {title.length}/100
                </p>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '8px'
                }}>
                  Contenido
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="¿Qué se trabajó en clase hoy? ¿Tareas asignadas? ¿Temas importantes?"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '16px', 
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    outline: 'none',
                    lineHeight: '1.6',
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '8px'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    background: 'var(--bg-tertiary)', 
                    color: 'var(--text-secondary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                  } as CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '12px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
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
                  {editingEntry ? 'Actualizar' : 'Guardar'}
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

export default Diary;