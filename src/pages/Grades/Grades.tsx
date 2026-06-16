import { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Plus, Trash2, FileText, Calculator, Download, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import type { CSSProperties } from 'react';

type ExcelCellStyle = NonNullable<XLSX.CellObject['s']>;
const MIN_SCORE = 10;
const MAX_SCORE = 50;
const PASSING_AVERAGE = 33;

type DraftGrades = Record<string, Record<string, number | null>>;

const activityTypeLabels: Record<string, string> = {
  tarea: 'Tarea',
  examen: 'Examen',
  proyecto: 'Proyecto',
  participacion: 'Participación',
  otro: 'Otro',
};

const activityTypeColors: Record<string, string> = {
  tarea: '#10b981',
  examen: '#ef4444',
  proyecto: '#8b5cf6',
  participacion: '#f59e0b',
  otro: '#6b7280',
};

const staggerDelay = (index: number) => ({
  animationDelay: `${index * 50}ms`,
});

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export const Grades = () => {
  const { state, getClasses, getStudentsByClass, getActivitiesByClass, getPeriodsByClass, getActivePeriodByClass, addActivity, deleteActivity, setGrade } = useApp();
  const [selectedClassId, setSelectedClassId] = useState(state.classes[0]?.id || '');
  const [selectedPeriodId, setSelectedPeriodId] = useState('all');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [draftGrades, setDraftGrades] = useState<DraftGrades>({});
  const [newActivity, setNewActivity] = useState({ 
    name: '', 
    type: 'tarea' as const, 
    periodId: '',
    maxScore: 50, 
    date: new Date().toISOString().split('T')[0] 
  });

  const classes = getClasses();
  const students = getStudentsByClass(selectedClassId);
  const activities = getActivitiesByClass(selectedClassId);
  const periods = getPeriodsByClass(selectedClassId);
  const activePeriod = getActivePeriodByClass(selectedClassId);
  const selectedClass = state.classes.find(c => c.id === selectedClassId);
  const periodActivities = activities.filter(activity =>
    selectedPeriodId === 'all' ? true : activity.periodId === selectedPeriodId
  );

  useEffect(() => {
    if (!selectedClassId) {
      setSelectedPeriodId('all');
      return;
    }
    setSelectedPeriodId(activePeriod?.id || 'all');
  }, [selectedClassId, activePeriod?.id]);

  const getGrade = (studentId: string, activityId: string) => {
    return state.grades.find(g => g.studentId === studentId && g.activityId === activityId);
  };

  useEffect(() => {
    const synced: DraftGrades = {};
    state.grades.forEach(grade => {
      if (grade.score !== null) {
        if (!synced[grade.activityId]) synced[grade.activityId] = {};
        synced[grade.activityId][grade.studentId] = grade.score;
      }
    });
    setDraftGrades(synced);
  }, [selectedClassId, state.grades]);

  const getDraftGrade = (studentId: string, activityId: string) => {
    return draftGrades[activityId]?.[studentId] ?? getGrade(studentId, activityId)?.score ?? null;
  };

  const getDisplayGrade = (studentId: string, activityId: string) => {
    const draft = draftGrades[activityId]?.[studentId];
    return draft !== undefined ? draft : getGrade(studentId, activityId)?.score ?? null;
  };

  const getSavedGrade = (studentId: string, activityId: string) => {
    return getGrade(studentId, activityId)?.score ?? null;
  };

  const draftEntries = Object.entries(draftGrades).flatMap(([activityId, grades]) =>
    Object.entries(grades).map(([studentId, score]) => ({ activityId, studentId, score }))
  );

  const visibleDraftEntries = draftEntries.filter(entry =>
    periodActivities.some(activity => activity.id === entry.activityId)
  );

  const hasDraftChanges = visibleDraftEntries.some(entry =>
    getSavedGrade(entry.studentId, entry.activityId) !== entry.score
  );

  const handleAddActivity = async () => {
    if (!newActivity.name.trim() || !selectedClassId || creatingActivity) return;

    setCreatingActivity(true);
    try {
      const created = await addActivity({ ...newActivity, classId: selectedClassId, periodId: newActivity.periodId || undefined });
      if (!created) return;
      toast.success(`Actividad "${newActivity.name}" creada correctamente`);
      setNewActivity({ 
        name: '', 
        type: 'tarea', 
        periodId: activePeriod?.id || '',
        maxScore: 50, 
        date: new Date().toISOString().split('T')[0] 
      });
      setShowAddActivity(false);
    } finally {
      setCreatingActivity(false);
    }
  };

  const handleGradeChange = (studentId: string, activityId: string, score: number | null) => {
    const value = score === null || score === undefined ? null : score;
    setDraftGrades(current => {
      const next = { ...current };
      if (!next[activityId]) next[activityId] = {};
      next[activityId][studentId] = value;
      return next;
    });
  };

  const validateDraftGrades = () => {
    return draftEntries.every(entry => {
      const activity = activities.find(a => a.id === entry.activityId);
      const maxScore = activity?.maxScore ?? MAX_SCORE;
      return entry.score === null || (entry.score >= MIN_SCORE && entry.score <= maxScore);
    });
  };

  const handleSaveGrades = async () => {
    if (!hasDraftChanges) return;

    if (!validateDraftGrades()) {
      toast.error(`Las notas deben estar entre ${MIN_SCORE} y ${MAX_SCORE}.`);
      return;
    }

    setSavingGrades(true);
    let saved = 0;
    let failed = 0;

    try {
      for (const entry of visibleDraftEntries) {
        const ok = await setGrade({
          activityId: entry.activityId,
          studentId: entry.studentId,
          score: entry.score,
        });
        if (ok) saved++;
        else failed++;
      }

      setDraftGrades({});

      if (failed > 0) {
        toast.error(`Se guardaron ${saved} notas, pero ${failed} fallaron.`);
      } else {
        toast.success(`${saved} notas guardadas correctamente`);
      }
    } finally {
      setSavingGrades(false);
    }
  };

  const getStudentAverage = (studentId: string) => {
    const studentGrades = periodActivities
      .map(activity => ({
        activity,
        score: getDisplayGrade(studentId, activity.id),
      }))
      .filter(({ score }) => score !== null);
    
    if (studentGrades.length === 0) return null;
    
    const scoreValues = studentGrades.map(({ activity, score }) => {
      if (score === null) return 0;
      return (score / activity.maxScore) * 50;
    });
    
    const total = scoreValues.reduce((sum, s) => sum + s, 0);
    return (total / scoreValues.length).toFixed(1);
  };

  const getStudentActivitiesCount = (studentId: string) => {
    return periodActivities.filter(activity => getDisplayGrade(studentId, activity.id) !== null).length;
  };

  const isPassing = (average: string | null) => {
    if (!average) return null;
    return parseFloat(average) >= PASSING_AVERAGE;
  };

  const getAverageColor = (average: string | null) => {
    if (!average) return 'var(--text-muted)';
    const num = parseFloat(average);
    if (num >= 33) return '#10b981';
    if (num >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getClassAverage = () => {
    const allGrades = periodActivities.flatMap(activity =>
      students.map(student => ({
        activity,
        score: getDisplayGrade(student.id, activity.id),
      }))
    ).filter(({ score }) => score !== null);
    
    if (allGrades.length === 0) return null;
    
    const scoreValues = allGrades.map(({ activity, score }) => {
      if (score === null) return 0;
      return (score / activity.maxScore) * 50;
    });
    
    const total = scoreValues.reduce((sum, s) => sum + s, 0);
    return (total / scoreValues.length).toFixed(1);
  };

  const handleDeleteActivity = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity && window.confirm(`¿Eliminar actividad "${activity.name}"? Se eliminarán todas las notas asociadas.`)) {
      deleteActivity(activityId);
      toast.success(`Actividad eliminada correctamente`);
    }
  };

  const handleExportExcel = () => {
    if (periodActivities.length === 0 || students.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const date = new Date().toISOString().split('T')[0];

    const styleRange = (sheet: XLSX.WorkSheet, range: string, style: ExcelCellStyle) => {
      const decodedRange = XLSX.utils.decode_range(range);
      for (let row = decodedRange.s.r; row <= decodedRange.e.r; row++) {
        for (let col = decodedRange.s.c; col <= decodedRange.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (sheet[cellRef]) {
            sheet[cellRef].s = { ...sheet[cellRef].s, ...style };
          }
        }
      }
    };

    const setColumnWidths = (sheet: XLSX.WorkSheet) => {
      const widths: { wch: number }[] = [];
      Object.keys(sheet)
        .filter(cell => cell[0] !== '!')
        .forEach(cell => {
          const value = sheet[cell].v;
          const column = cell.replace(/[0-9]+/, '');
          const colIndex = XLSX.utils.decode_col(column);
          const width = String(value ?? '').length + 2;
          widths[colIndex] = {
            wch: Math.min(Math.max(widths[colIndex]?.wch ?? 10, width), 36),
          };
        });
      sheet['!cols'] = widths;
    };

    const headerStyle: ExcelCellStyle = {
      fill: { fgColor: { rgb: '4F46E5' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '4F46E5' } },
        bottom: { style: 'thin', color: { rgb: '4F46E5' } },
        left: { style: 'thin', color: { rgb: 'DADFE9' } },
        right: { style: 'thin', color: { rgb: 'DADFE9' } },
      },
    };

    const subHeaderStyle: ExcelCellStyle = {
      fill: { fgColor: { rgb: 'EEF2FF' } },
      font: { bold: true, color: { rgb: '3730A3' } },
      border: {
        bottom: { style: 'thin', color: { rgb: 'C7D2FE' } },
      },
    };

    const thinBorderStyle: ExcelCellStyle = {
      border: {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } },
      },
      alignment: { vertical: 'center' },
    };

    const passingStyle: ExcelCellStyle = {
      ...thinBorderStyle,
      fill: { fgColor: { rgb: 'DCFCE7' } },
      font: { color: { rgb: '166534' }, bold: true },
    };

    const failingStyle: ExcelCellStyle = {
      ...thinBorderStyle,
      fill: { fgColor: { rgb: 'FEE2E2' } },
      font: { color: { rgb: '991B1B' }, bold: true },
    };

    const pendingStyle: ExcelCellStyle = {
      ...thinBorderStyle,
      fill: { fgColor: { rgb: 'FEF3C7' } },
    };

    const gradeRows: (string | number)[][] = [
      ['Clase', selectedClass?.name ?? '', 'Asignatura', selectedClass?.subject ?? ''],
      ['Docente', state.user?.name ?? '', 'Fecha de exportación', date],
      ['Escala de notas', `${MIN_SCORE}-${MAX_SCORE}`, 'Mínimo aprobatorio', PASSING_AVERAGE],
      [],
      ['No.', 'Estudiante', ...periodActivities.map(activity => `${activity.name}\n${activityTypeLabels[activity.type]} · Máx: ${activity.maxScore}`), 'Promedio', 'Estado', 'Actividades con nota'],
      ...students.map((student, index) => {
        const avg = getStudentAverage(student.id);
        const passing = isPassing(avg);
        const gradeCount = getStudentActivitiesCount(student.id);

        return [
          index + 1,
          `${student.name} ${student.lastName}`,
          ...periodActivities.map(activity => getDisplayGrade(student.id, activity.id) ?? '-'),
          avg ?? '-',
          passing !== null ? (passing ? 'Aprobado' : 'Reprobado') : '-',
          gradeCount,
        ];
      }),
    ];

    const gradeSheet = XLSX.utils.aoa_to_sheet(gradeRows);
    gradeSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },
    ];
    gradeSheet['!autofilter'] = { ref: `A5:${XLSX.utils.encode_col(gradeRows[4].length - 1)}${gradeRows.length}` };
    styleRange(gradeSheet, 'A1:D3', subHeaderStyle);
    styleRange(gradeSheet, `A5:${XLSX.utils.encode_col(gradeRows[4].length - 1)}5`, headerStyle);

    for (let row = 6; row <= gradeRows.length; row++) {
      const avg = gradeRows[row - 1][gradeRows[4].length - 3] as string | number;
      const status = gradeRows[row - 1][gradeRows[4].length - 2] as string | number;
      const statusStyle = status === 'Aprobado' ? passingStyle : status === 'Reprobado' ? failingStyle : thinBorderStyle;
      styleRange(gradeSheet, `A${row}:${XLSX.utils.encode_col(gradeRows[4].length - 1)}${row}`, statusStyle);
      if (typeof avg === 'number' || (typeof avg === 'string' && avg !== '-')) {
        const avgCell = XLSX.utils.encode_cell({ r: row - 1, c: gradeRows[4].length - 3 });
        gradeSheet[avgCell].s = { ...gradeSheet[avgCell].s, font: { bold: true } };
      }
      for (let col = 3; col <= periodActivities.length + 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (typeof gradeRows[row - 1][col] === 'number') {
          gradeSheet[cellRef].s = { ...gradeSheet[cellRef].s, ...pendingStyle };
        }
      }
    }
    setColumnWidths(gradeSheet);

    const summaryRows: (string | number)[][] = [
      ['Indicador', 'Valor'],
      ['Clase', selectedClass?.name ?? ''],
      ['Asignatura', selectedClass?.subject ?? ''],
      ['Total estudiantes', students.length],
      ['Total actividades', periodActivities.length],
      ['Promedio de clase', getClassAverage() ?? '-'],
      ['Aprobados', students.filter(student => isPassing(getStudentAverage(student.id)) === true).length],
      ['Reprobados', students.filter(student => isPassing(getStudentAverage(student.id)) === false).length],
      ['Sin promedio', students.filter(student => getStudentAverage(student.id) === null).length],
      [],
      ['Resumen por estudiante', '', '', ''],
      ['Estudiante', 'Promedio', 'Estado', 'Actividades con nota'],
      ...students.map(student => {
        const avg = getStudentAverage(student.id);
        const passing = isPassing(avg);
        return [
          `${student.name} ${student.lastName}`,
          avg ?? '-',
          passing !== null ? (passing ? 'Aprobado' : 'Reprobado') : '-',
          getStudentActivitiesCount(student.id),
        ];
      }),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    styleRange(summarySheet, 'A1:B1', headerStyle);
    styleRange(summarySheet, 'A11:D11', headerStyle);
    styleRange(summarySheet, 'A1:B10', subHeaderStyle);
    setColumnWidths(summarySheet);

    const activityRows: (string | number)[][] = [
      ['Actividad', 'Tipo', 'Puntaje máximo', 'Fecha'],
      ...periodActivities.map(activity => [
        activity.name,
        activityTypeLabels[activity.type],
        activity.maxScore,
        activity.date,
      ]),
    ];

    const activitySheet = XLSX.utils.aoa_to_sheet(activityRows);
    styleRange(activitySheet, 'A1:D1', headerStyle);
    setColumnWidths(activitySheet);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, gradeSheet, 'Calificaciones');
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(wb, activitySheet, 'Actividades');

    if (hasDraftChanges) {
      const pendingRows: (string | number)[][] = [
        ['Estudiante', 'Actividad', 'Nota actual', 'Nota pendiente', 'Diferencia'],
        ...visibleDraftEntries
          .filter(entry => getSavedGrade(entry.studentId, entry.activityId) !== entry.score)
          .map(entry => {
            const student = students.find(s => s.id === entry.studentId);
      const activity = periodActivities.find(a => a.id === entry.activityId);
            const saved = getSavedGrade(entry.studentId, entry.activityId);
            return [
              student ? `${student.name} ${student.lastName}` : entry.studentId,
              activity?.name ?? entry.activityId,
              saved ?? '-',
              entry.score ?? '-',
              saved === null || entry.score === null ? '-' : (entry.score - saved).toFixed(1),
            ];
          }),
      ];

      const pendingSheet = XLSX.utils.aoa_to_sheet(pendingRows);
      styleRange(pendingSheet, 'A1:E1', headerStyle);
      setColumnWidths(pendingSheet);
      XLSX.utils.book_append_sheet(wb, pendingSheet, 'Cambios pendientes');
    }

    XLSX.writeFile(wb, `Calificaciones_${selectedClass?.name}_${date}.xlsx`);
    
    toast.success(`📊 Calificaciones exportadas a Excel`);
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
            Calificaciones
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Gestión de notas y evaluaciones
          </p>
        </div>

        {selectedClassId && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddActivity(true)}
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
                minWidth: '160px',
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
              Nueva Actividad
            </button>

            <button
              onClick={handleSaveGrades}
              disabled={!hasDraftChanges || savingGrades}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '16px',
                background: hasDraftChanges ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-tertiary)',
                color: hasDraftChanges ? 'white' : 'var(--text-muted)',
                border: 'none',
                cursor: hasDraftChanges ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: hasDraftChanges ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                transition: 'all 0.2s ease',
                minWidth: '160px',
              } as CSSProperties}
              onMouseEnter={(e) => {
                if (hasDraftChanges) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = hasDraftChanges ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none';
              }}
            >
              <CheckCircle size={20} />
              {savingGrades ? 'Guardando...' : `Guardar notas${hasDraftChanges ? ` (${draftEntries.length})` : ''}`}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={periodActivities.length === 0 || students.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '16px',
                background: periodActivities.length > 0 && students.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-tertiary)',
                color: periodActivities.length > 0 && students.length > 0 ? 'white' : 'var(--text-muted)',
                border: 'none',
                cursor: periodActivities.length > 0 && students.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: periodActivities.length > 0 && students.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                transition: 'all 0.2s ease',
                minWidth: '160px',
              } as CSSProperties}
              onMouseEnter={(e) => {
                if (periodActivities.length > 0 && students.length > 0) {
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
              Exportar Excel del periodo
            </button>
          </div>
        )}
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
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name} — {cls.subject}</option>
          ))}
        </select>
      </div>

      {selectedClassId && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid var(--border-color)' 
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}>
            Filtrar por Periodo
          </label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
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
            <option value="all">Todos los periodos</option>
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                Periodo {period.periodNumber} — {formatDate(period.startDate)} al {formatDate(period.endDate)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Modal: Nueva Actividad */}
      {showAddActivity && (
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
                Nueva Actividad
              </h2>
              <button
                onClick={() => setShowAddActivity(false)}
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
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  placeholder="Ej: Examen Parcial, Tarea 1..."
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

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Tipo
                </label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as typeof newActivity.type })}
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
                  <option value="tarea">Tarea</option>
                  <option value="examen">Examen</option>
                  <option value="proyecto">Proyecto</option>
                  <option value="participacion">Participación</option>
                  <option value="otro">Otro</option>
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
                  Periodo
                </label>
                <select
                  value={newActivity.periodId || ''}
                  onChange={(e) => setNewActivity({ ...newActivity, periodId: e.target.value })}
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
                  <option value="">Sin periodo</option>
                  {periods.map(period => (
                    <option key={period.id} value={period.id} disabled={period.isClosed}>
                      Periodo {period.periodNumber} {period.isClosed ? '(Cerrado)' : ''}
                    </option>
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
                  Fecha
                </label>
                <input
                  type="date"
                  value={newActivity.date}
                  onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
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

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)', 
                  marginBottom: '6px' 
                }}>
                  Puntaje Máximo (default: 50)
                </label>
                <input
                  type="number"
                  min={MIN_SCORE}
                  max={MAX_SCORE}
                  value={newActivity.maxScore}
                  onChange={(e) => setNewActivity({ 
                    ...newActivity, 
                    maxScore: Math.min(MAX_SCORE, Math.max(MIN_SCORE, parseInt(e.target.value) || 50)) 
                  })}
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={() => setShowAddActivity(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddActivity}
                  disabled={!newActivity.name.trim() || creatingActivity}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: newActivity.name.trim() && !creatingActivity ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: newActivity.name.trim() && !creatingActivity ? 'var(--accent-text)' : 'var(--text-muted)',
                    cursor: newActivity.name.trim() && !creatingActivity ? 'pointer' : 'not-allowed',
                  }}
                >
                  {creatingActivity ? 'Creando...' : 'Crear Actividad'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Clase */}
      {selectedClassId && periodActivities.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            borderRadius: '12px', 
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
                <FileText size={24} color="white" />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Actividades</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {periodActivities.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--bg-secondary)', 
            borderRadius: '12px', 
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
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Aprobados</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', margin: 0 }}>
                  {students.filter(s => isPassing(getStudentAverage(s.id))).length}
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--bg-secondary)', 
            borderRadius: '12px', 
            padding: '20px', 
            border: '1px solid var(--border-color)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: '#ef4444',
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <XCircle size={24} color="white" />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Reprobados</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444', margin: 0 }}>
                  {students.filter(s => isPassing(getStudentAverage(s.id)) === false).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Actividades */}
      {selectedClassId && (
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
              {selectedClass?.name} — {periodActivities.length} actividades
            </h2>
            
            {getClassAverage() && (
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calculator size={18} />
                <span>Promedio de clase: <strong>{getClassAverage()}</strong></span>
              </div>
            )}
          </div>

          {periodActivities.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
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
                <FileText size={48} color="var(--text-muted)" />
              </div>
              <p style={{ 
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                No hay actividades en este filtro
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Crea una actividad para empezar a registrar calificaciones
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
                    {periodActivities.map(activity => (
                      <th key={activity.id} style={{ 
                        padding: '14px 12px', 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        borderBottom: '2px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        minWidth: '100px',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              color: activityTypeColors[activity.type] || 'var(--text-primary)',
                              whiteSpace: 'nowrap'
                            }}>
                              {activity.name}
                            </span>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px',
                                transition: 'background 0.2s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              title="Eliminar actividad"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap'
                          }}>
                            {activityTypeLabels[activity.type]} • {activity.maxScore} pts
                          </span>
                        </div>
                      </th>
                    ))}
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
                      minWidth: '80px',
                    }}>
                      Promedio
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
                      minWidth: '120px',
                    }}>
                      Estado
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
                      minWidth: '100px',
                    }}>
                      Actividades
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const avg = getStudentAverage(student.id);
                    const passing = isPassing(avg);
                    const gradeCount = getStudentActivitiesCount(student.id);
                    const avgColor = getAverageColor(avg);

                    return (
                      <tr key={student.id} style={{
                        animation: 'fadeIn 0.3s ease forwards',
                        ...staggerDelay(index),
                      } as CSSProperties}>
                        <td style={{ 
                          padding: '16px', 
                          fontSize: '14px', 
                          color: 'var(--text-primary)',
                          borderBottom: '1px solid var(--border-color)',
                          fontWeight: '500',
                          background: 'var(--bg-secondary)',
                        }}>
                          {student.name} {student.lastName}
                        </td>
                        {periodActivities.map(activity => {
                          const savedGrade = getSavedGrade(student.id, activity.id);
                          const draftGrade = getDraftGrade(student.id, activity.id);
                          const hasChange = savedGrade !== draftGrade;
                          return (
                            <td key={activity.id} style={{ 
                              padding: '10px', 
                              textAlign: 'center', 
                              borderBottom: '1px solid var(--border-color)',
                            }}>
                              <input
                                type="number"
                                step="0.1"
                                value={draftGrade ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                  handleGradeChange(student.id, activity.id, Number.isNaN(val as number) ? null : val);
                                }}
                                placeholder="-"
                                style={{
                                  width: '70px',
                                  padding: '8px',
                                  textAlign: 'center',
                                  borderRadius: '8px',
                                  border: `1px solid ${hasChange ? '#10b981' : 'var(--border-color)'}`,
                                  background: hasChange ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                                  fontSize: '14px',
                                  color: 'var(--text-primary)',
                                  outline: 'none',
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = hasChange ? '#10b981' : 'var(--border-color)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              />
                            </td>
                          );
                        })}
                        <td style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          fontWeight: '600', 
                          fontSize: '16px',
                          color: avgColor,
                          borderBottom: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                        }}>
                          {avg ?? '-'}
                        </td>
                        <td style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          borderBottom: '1px solid var(--border-color)',
                        }}>
                          {avg ? (
                            passing !== null ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '13px',
                                fontWeight: '500',
                                background: passing ? '#10b98122' : '#ef444422',
                                color: passing ? '#10b981' : '#ef4444',
                              }}>
                                {passing ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {passing ? 'Aprueba' : 'Reprueba'}
                              </span>
                            ) : '-'
                          ) : '-'}
                        </td>
                        <td style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                          borderBottom: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                        }}>
                          {gradeCount} / {periodActivities.length}
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