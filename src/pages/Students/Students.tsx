import { useState, useRef, useMemo } from 'react';
import { useApp } from '../../store';
import { Users, UserCheck, UserX, Upload, Download, Search, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import type { CSSProperties } from 'react';

const staggerDelay = (index: number) => ({
  animationDelay: `${index * 50}ms`,
});

export const Students = () => {
  const { state, getStudentsByClass, getAttendanceByDateAndClass, addStudent, deleteStudent } = useApp();
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const students = useMemo(() => {
    const classStudents = selectedClassId ? getStudentsByClass(selectedClassId) : [];
    if (!searchTerm) return classStudents;
    return classStudents.filter(s =>
      `${s.name} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedClassId, getStudentsByClass, searchTerm]);

  const selectedClass = state.classes.find(c => c.id === selectedClassId);

  const getStudentSummary = (studentId: string) => {
    const allAttendance = state.attendance.filter(
      a => a.studentId === studentId && a.classId === selectedClassId
    );
    
    const totalAbsences = allAttendance.filter(a => a.status === 'ausente').length;
    const totalJustified = allAttendance.filter(a => 
      a.status === 'ausencia_justificada' || a.status === 'retraso_justificado'
    ).length;
    const totalPresent = allAttendance.filter(a => a.status === 'presente').length;

    return { totalPresent, totalAbsences, totalJustified };
  };

  const classSummary = (students.length > 0 ? students.reduce((acc, student) => {
    const s = getStudentSummary(student.id);
    return {
      totalPresent: acc.totalPresent + s.totalPresent,
      totalAbsences: acc.totalAbsences + s.totalAbsences,
      totalJustified: acc.totalJustified + s.totalJustified,
    };
  }, { totalPresent: 0, totalAbsences: 0, totalJustified: 0 }) : { totalPresent: 0, totalAbsences: 0, totalJustified: 0 });

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassId) return;

    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes(selectedClass?.name.toLowerCase() || '')
        ) || workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        // Fila 8 (range: 7), columnas B-E (índices 1-4)
        const jsonData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, 
          range: 7 
        }) as string[][];

        const existingNames = new Set(
          state.students
            .filter(s => s.classId === selectedClassId)
            .map(s => `${s.lastName.toLowerCase()}_${s.name.toLowerCase()}`)
        );

        let imported = 0;
        let skipped = 0;

        for (const row of jsonData) {
          const ape1 = String(row[1] || '').trim();
          const ape2 = String(row[2] || '').trim();
          const nom1 = String(row[3] || '').trim();
          const nom2 = String(row[4] || '').trim();

          const fullLastName = `${ape1} ${ape2}`.trim();
          const fullName = `${nom1} ${nom2}`.trim();

          if (ape1 && nom1) {
            const key = `${fullName.toLowerCase()}_${fullLastName.toLowerCase()}`;
            if (existingNames.has(key)) {
              skipped++;
              continue;
            }

            const created = await addStudent({
              classId: selectedClassId,
              name: fullLastName,
              lastName: fullName,
            });

            if (created) {
              existingNames.add(key);
              imported++;
            }
          }
        }

        if (imported > 0) {
          toast.success(`✅ ${imported} estudiantes importados correctamente${skipped > 0 ? `. ${skipped} duplicados omitidos` : ''}`);
        } else if (skipped > 0) {
          toast.warning(`Todos los estudiantes ya existían. ${skipped} duplicados omitidos.`);
        } else {
          toast.error('No se encontraron estudiantes válidos en el archivo.');
        }

      } catch (error) {
        console.error('Error importing Excel:', error);
        toast.error('❌ Error al procesar el archivo Excel. Verifica la estructura.');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    if (!selectedClassId || students.length === 0) return;

    const classAttendance = state.attendance.filter(a => a.classId === selectedClassId);
    const dates = [...new Set(classAttendance.map(a => a.date))].sort();

    type SheetRow = (string | number | undefined)[];

    const sheet1Data: SheetRow[] = [
      ['No.', 'Apellidos', 'Nombres', ...dates, 'Total Presente', 'Total Ausencias', 'Total Justificadas']
    ];

    students.forEach((student, index) => {
      const studentAttendance = classAttendance.filter(a => a.studentId === student.id);
      const row: (string | number)[] = [index + 1, student.name, student.lastName];
      let present = 0, absences = 0, justified = 0;

      dates.forEach(date => {
        const att = studentAttendance.find(a => a.date === date);
        if (att) {
          row.push(att.status === 'presente' ? 'P' : att.status === 'ausente' ? 'A' : 'J');
          if (att.status === 'presente') present++;
          if (att.status === 'ausente') absences++;
          if (att.status === 'ausencia_justificada' || att.status === 'retraso_justificado') justified++;
        } else {
          row.push('-');
        }
      });

      row.push(present, absences, justified);
      sheet1Data.push(row);
    });

    const summaryData: SheetRow[] = [
      ['No.', 'Apellidos', 'Nombres', 'Total Presente', 'Total Ausencias', 'Total Justificadas'],
      ...students.map((student, index) => {
        const s = getStudentSummary(student.id);
        return [index + 1, student.name, student.lastName, s.totalPresent, s.totalAbsences, s.totalJustified];
      }),
      ['TOTALES', '', '', classSummary.totalPresent, classSummary.totalAbsences, classSummary.totalJustified]
    ];

    const wb = XLSX.utils.book_new();
    const attendanceSheet = XLSX.utils.aoa_to_sheet(sheet1Data);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    attendanceSheet['!freeze'] = 'A2';
    summarySheet['!freeze'] = 'A2';
    attendanceSheet['!cols'] = sheet1Data[0].map((_, index) => ({
      width: index === 0 ? 6 : index === 1 || index === 2 ? 24 : index > sheet1Data[0].length - 4 ? 16 : 12
    }));
    summarySheet['!cols'] = [
      { width: 6 },
      { width: 24 },
      { width: 24 },
      { width: 16 },
      { width: 16 },
      { width: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, attendanceSheet, 'Asistencia Detallada');
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen General');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Asistencia_${selectedClass?.name}_${date}.xlsx`);
    
    toast.success(`📊 Lista de estudiantes exportada a Excel`);
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (window.confirm(`¿Eliminar a ${student?.lastName} ${student?.name}?`)) {
      deleteStudent(studentId);
      toast.success(`Estudiante eliminado correctamente`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fileInputRef.current && selectedClassId) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Alumnos
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Gestión y control de asistencia
          </p>
        </div>

        {selectedClassId && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              onKeyDown={handleKeyDown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '16px',
                background: importing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
                color: 'white',
                border: 'none',
                cursor: importing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: importing ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.25)',
                transition: 'all 0.2s ease',
                minWidth: '180px',
              } as CSSProperties}
              onMouseEnter={(e) => {
                if (!importing) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
              }}
            >
              <Upload size={20} />
              {importing ? 'Importando...' : 'Importar desde Excel'}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={students.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '16px',
                background: students.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-tertiary)',
                color: students.length > 0 ? 'white' : 'var(--text-muted)',
                border: 'none',
                cursor: students.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: students.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                transition: 'all 0.2s ease',
                minWidth: '160px',
              } as CSSProperties}
              onMouseEnter={(e) => {
                if (students.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
              }}
            >
              <Download size={20} />
              Exportar Lista
            </button>
          </div>
        )}
      </div>

      {/* Selector de Clase y Búsqueda */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid var(--border-color)',
          flex: '1 1 280px',
          minWidth: '280px'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}>
            Seleccionar Clase
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '16px',
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
          border: '1px solid var(--border-color)',
          flex: '1 1 280px',
          minWidth: '280px'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}>
            Buscar estudiante
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
              placeholder="Nombre o apellido..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Alumnos + Resumen */}
      {selectedClassId && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)', 
          overflow: 'hidden' 
        }}>
          {/* Header del Listado */}
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {selectedClass?.name} — <strong>{students.length}</strong> alumnos
                {searchTerm && ` (filtrados de ${getStudentsByClass(selectedClassId).length})`}
              </h2>
            </div>
            
            {students.length > 0 && (
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <span>
                  Presentes: <strong style={{ color: '#10b981' }}>{classSummary.totalPresent}</strong>
                </span>
                <span>
                  Ausencias: <strong style={{ color: '#ef4444' }}>{classSummary.totalAbsences}</strong>
                </span>
                <span>
                  Justificadas: <strong style={{ color: '#f59e0b' }}>{classSummary.totalJustified}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Grid de Estudiantes */}
          {students.length > 0 ? (
            <div style={{ display: 'grid', gap: '1px', background: 'var(--border-color)' }}>
              {/* Encabezado de tabla */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '16px',
                padding: '16px 20px',
                background: 'var(--bg-tertiary)',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <span>Estudiante</span>
                <span style={{ textAlign: 'center' }}>Hoy</span>
                <span style={{ textAlign: 'center', width: '100px' }}>Acciones</span>
              </div>

              {students.map((student, index) => {
                const todayAtt = getAttendanceByDateAndClass(
                  new Date().toISOString().split('T')[0], 
                  selectedClassId
                ).find(a => a.studentId === student.id);
                
                const summary = getStudentSummary(student.id);

                return (
                  <div 
                    key={student.id} 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: '16px',
                      padding: '18px 20px',
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-color)',
                      alignItems: 'center',
                      animation: 'fadeIn 0.3s ease forwards',
                      ...staggerDelay(index),
                      transition: 'background 0.2s ease',
                    } as CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Users size={24} color="white" />
                      </div>
                      <div>
                        <p style={{ 
                          fontWeight: '600', 
                          margin: '0 0 4px 0',
                          color: 'var(--text-primary)',
                          fontSize: '15px'
                        }}>
                          {student.name} {student.lastName}
                        </p>
                        <p style={{ 
                          fontSize: '13px', 
                          color: 'var(--text-muted)', 
                          margin: 0 
                        }}>
                          Ausencias: <span style={{ color: '#ef4444' }}>{summary.totalAbsences}</span> • 
                          Justificadas: <span style={{ color: '#f59e0b' }}>{summary.totalJustified}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {todayAtt ? (
                        <div style={{
                          padding: '8px 16px',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: todayAtt.status === 'presente' ? '#10b981' : 
                                     todayAtt.status === 'ausencia_justificada' || todayAtt.status === 'retraso_justificado' ? '#f59e0b' : '#ef4444',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap'
                        }}>
                          {todayAtt.status === 'presente' ? (
                            <UserCheck size={16} />
                          ) : (
                            <UserX size={16} />
                          )}
                          {todayAtt.status === 'presente' ? 'Presente' : 
                           todayAtt.status === 'ausencia_justificada' || todayAtt.status === 'retraso_justificado' ? 'Justificado' : 'Ausente'}
                        </div>
                      ) : (
                        <span style={{ 
                          fontSize: '13px', 
                          color: 'var(--text-muted)',
                          fontStyle: 'italic'
                        }}>
                          Sin registro
                        </span>
                      )}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'var(--bg-tertiary)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef444422';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                        }}
                        title="Eliminar estudiante"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                <Users size={48} color="var(--text-muted)" />
              </div>
              <p style={{ 
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                {searchTerm ? 'No se encontraron estudiantes' : 'No hay alumnos en esta clase'}
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--text-muted)' 
              }}>
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Importa un archivo Excel para comenzar'}
              </p>
            </div>
          )}
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