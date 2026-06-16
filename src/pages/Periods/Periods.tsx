import { useState } from 'react';
import { useApp } from '../../store';
import { CalendarDays, Download, Lock, Plus, Save, Trash2, Unlock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import type { Activity, Attendance, Period, Student } from '../../types';

type ExcelCellStyle = NonNullable<XLSX.CellObject['s']>;
const MIN_SCORE = 10;
const MAX_SCORE = 50;
const PASSING_AVERAGE = 33;

type PeriodForm = Omit<Period, 'id' | 'isClosed' | 'closedAt'>;

const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  activo: 'Activo',
  cerrado: 'Cerrado',
};

const statusColors: Record<string, string> = {
  pendiente: '#6b7280',
  activo: '#10b981',
  cerrado: '#ef4444',
};

const activityTypeLabels: Record<string, string> = {
  tarea: 'Tarea',
  examen: 'Examen',
  proyecto: 'Proyecto',
  participacion: 'Participación',
  otro: 'Otro',
};

const emptyForm = (classId: string, periodNumber: 1 | 2 | 3 | 4): PeriodForm => {
  const monthOffset = (periodNumber - 1) * 3;
  const start = new Date(2026, monthOffset, 15);
  const end = new Date(2026, monthOffset + 2, 20);

  return {
    classId,
    periodNumber,
    name: `Periodo ${periodNumber}`,
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const formatDate = (value: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export const Periods = () => {
  const {
    state,
    getClasses,
    getPeriodsByClass,
    getActivePeriodByClass,
    getPeriodStatus,
    addPeriod,
    updatePeriod,
    closePeriod,
    deletePeriod,
    getActivitiesByClass,
  } = useApp();

  const classes = getClasses();
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [form, setForm] = useState<PeriodForm | null>(null);

  const selectedClass = state.classes.find(c => c.id === selectedClassId);
  const periods = getPeriodsByClass(selectedClassId);
  const activePeriod = getActivePeriodByClass(selectedClassId);
  const activities = getActivitiesByClass(selectedClassId);
  const students = state.students.filter(student => student.classId === selectedClassId);

  const openCreate = (periodNumber: 1 | 2 | 3 | 4) => {
    const exists = periods.find(p => p.periodNumber === periodNumber);
    if (exists) {
      setEditingPeriod(exists);
      setForm({
        classId: exists.classId,
        periodNumber: exists.periodNumber,
        name: exists.name,
        startDate: exists.startDate,
        endDate: exists.endDate,
      });
      return;
    }

    setEditingPeriod(null);
    setForm(emptyForm(selectedClassId, periodNumber));
  };

  const handleSave = async () => {
    if (!form || !selectedClassId) return;

    const saved = editingPeriod
      ? await updatePeriod(editingPeriod.id, form)
      : await addPeriod(form);

    if (saved) {
      toast.success(editingPeriod ? 'Periodo actualizado correctamente' : 'Periodo creado correctamente');
      setForm(null);
      setEditingPeriod(null);
    }
  };

  const handleClose = async (period: Period) => {
    const today = new Date().toISOString().split('T')[0];
    if (today < period.endDate) {
      toast.error('El periodo solo se puede cerrar cuando llegue su fecha final.');
      return;
    }

    const ok = await closePeriod(period.id);
    if (ok) toast.success(`Periodo ${period.periodNumber} cerrado correctamente`);
  };

  const handleDelete = async (period: Period) => {
    if (!window.confirm(`¿Eliminar el periodo ${period.periodNumber}? Las actividades quedarán sin periodo.`)) return;
    await deletePeriod(period.id);
    toast.success('Periodo eliminado correctamente');
  };

  const getPeriodActivities = (period: Period) => activities.filter(activity => activity.periodId === period.id);

  const getPeriodAttendanceStats = (period: Period, students: Student[], attendance: Attendance[]) => {
    const periodAttendance = attendance.filter(record =>
      record.classId === selectedClassId &&
      record.date >= period.startDate &&
      record.date <= period.endDate
    );

    return students.map(student => {
      const records = periodAttendance.filter(record => record.studentId === student.id);
      const total = records.length;
      const present = records.filter(record => record.status === 'presente').length;
      const justified = records.filter(record => ['ausencia_justificada', 'retraso_justificado'].includes(record.status)).length;
      const absent = records.filter(record => record.status === 'ausente').length;
      const late = records.filter(record => record.status === 'retraso_justificado').length;
      const percentage = total === 0 ? 0 : Math.round(((present + justified + late) / total) * 100);

      return {
        student,
        total,
        present,
        justified,
        absent,
        late,
        percentage,
      };
    });
  };

  const getGrade = (studentId: string, activityId: string) => state.grades.find(grade =>
    grade.studentId === studentId && grade.activityId === activityId
  );

  const getStudentPeriodAverage = (studentId: string, periodActivities: Activity[]) => {
    const grades = periodActivities
      .map(activity => ({ activity, grade: getGrade(studentId, activity.id) }))
      .filter(item => item.grade?.score !== undefined && item.grade?.score !== null);

    if (grades.length === 0) return null;

    const total = grades.reduce((sum, item) => {
      if (item.grade?.score === null || item.grade?.score === undefined) return sum;
      return sum + (item.grade.score / item.activity.maxScore) * 50;
    }, 0);

    return (total / grades.length).toFixed(1);
  };

  const getClosedPeriodAverages = (studentId: string) => {
    return periods
      .filter(period => period.isClosed)
      .map(period => ({
        period,
        average: getStudentPeriodAverage(studentId, getPeriodActivities(period)),
      }))
      .filter(item => item.average !== null);
  };

  const getNeededNextAverage = (studentId: string) => {
    const completed = getClosedPeriodAverages(studentId);
    const remaining = 4 - completed.length;

    if (remaining <= 0) return null;

    const currentSum = completed.reduce((sum, item) => sum + Number(item.average), 0);
    return ((PASSING_AVERAGE * 4) - currentSum) / remaining;
  };

  const exportPeriodReport = (period: Period) => {
    const students = state.students.filter(student => student.classId === selectedClassId);
    const periodActivities = getPeriodActivities(period);
    const attendanceStats = getPeriodAttendanceStats(period, students, state.attendance);

    if (students.length === 0) {
      toast.error('No hay estudiantes para exportar este reporte');
      return;
    }

    const date = new Date().toISOString().split('T')[0];

    const coverRows: (string | number)[][] = [
      ['Clase', selectedClass?.name ?? '', 'Asignatura', selectedClass?.subject ?? ''],
      ['Profesor', state.user?.name ?? '', 'Fecha exportación', date],
      ['Periodo', `Periodo ${period.periodNumber}`, 'Estado', statusLabels[getPeriodStatus(period)]],
      ['Fecha inicial', formatDate(period.startDate), 'Fecha final', formatDate(period.endDate)],
      ['Escala', `${MIN_SCORE}-${MAX_SCORE}`, 'Mínimo aprobatorio', PASSING_AVERAGE],
    ];

    const summaryRows: (string | number)[][] = [
      ['Estudiante', 'Promedio periodo', 'Estado periodo', 'Asistencia', 'Actividades evaluadas'],
      ...students.map(student => {
        const avg = getStudentPeriodAverage(student.id, periodActivities);
        const passing = avg === null ? null : parseFloat(avg) >= PASSING_AVERAGE;
        const stats = attendanceStats.find(item => item.student.id === student.id);
        return [
          `${student.name} ${student.lastName}`,
          avg ?? '-',
          passing === null ? '-' : passing ? 'Aprobado' : 'Reprobado',
          stats ? `${stats.percentage}%` : '-',
          periodActivities.filter(activity => getGrade(student.id, activity.id)?.score !== undefined && getGrade(student.id, activity.id)?.score !== null).length,
        ];
      }),
    ];

    const gradesRows: (string | number)[][] = [
      ['Estudiante', ...periodActivities.map(activity => `${activity.name}\n${activityTypeLabels[activity.type]} · Máx: ${activity.maxScore}`), 'Promedio', 'Estado'],
      ...students.map(student => {
        const avg = getStudentPeriodAverage(student.id, periodActivities);
        const passing = avg === null ? null : parseFloat(avg) >= PASSING_AVERAGE;
        return [
          `${student.name} ${student.lastName}`,
          ...periodActivities.map(activity => getGrade(student.id, activity.id)?.score ?? '-'),
          avg ?? '-',
          passing === null ? '-' : passing ? 'Aprobado' : 'Reprobado',
        ];
      }),
    ];

    const attendanceRows: (string | number)[][] = [
      ['Estudiante', 'Días registrados', 'Presentes', 'Ausentes', 'Justificadas', 'Retardos', 'Porcentaje'],
      ...attendanceStats.map(item => [
        `${item.student.name} ${item.student.lastName}`,
        item.total,
        item.present,
        item.absent,
        item.justified,
        item.late,
        `${item.percentage}%`,
      ]),
    ];

    const activityRows: (string | number)[][] = [
      ['Actividad', 'Tipo', 'Fecha', 'Puntaje máximo'],
      ...periodActivities.map(activity => [
        activity.name,
        activityTypeLabels[activity.type],
        activity.date,
        activity.maxScore,
      ]),
    ];

    const accumulatedRows: (string | number)[][] = [
      ['Estudiante', 'P1', 'P2', 'P3', 'P4', 'Promedio acumulado', 'Estado año', 'Nota necesaria'],
      ...students.map(student => {
        const periodAverages = [1, 2, 3, 4].map(number => {
          const period = periods.find(item => item.periodNumber === number);
          return period ? getStudentPeriodAverage(student.id, getPeriodActivities(period)) ?? '-' : '-';
        });
        const completed = getClosedPeriodAverages(student.id);
        const currentSum = completed.reduce((sum, item) => sum + Number(item.average), 0);
        const accumulated = completed.length === 0 ? '-' : (currentSum / completed.length).toFixed(1);
        const needed = getNeededNextAverage(student.id);
        const status = accumulated === '-' ? '-' : Number(accumulated) >= PASSING_AVERAGE ? 'Va aprobando' : 'Va reprobando';

        return [
          `${student.name} ${student.lastName}`,
          ...periodAverages,
          accumulated,
          status,
          needed === null ? '-' : needed.toFixed(1),
        ];
      }),
    ];

    const wb = XLSX.utils.book_new();
    const coverSheet = XLSX.utils.aoa_to_sheet(coverRows);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    const gradesSheet = XLSX.utils.aoa_to_sheet(gradesRows);
    const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceRows);
    const activitySheet = XLSX.utils.aoa_to_sheet(activityRows);
    const accumulatedSheet = XLSX.utils.aoa_to_sheet(accumulatedRows);

    const styleRange = (sheet: XLSX.WorkSheet, range: string, style: ExcelCellStyle) => {
      const decoded = XLSX.utils.decode_range(range);
      for (let row = decoded.s.r; row <= decoded.e.r; row++) {
        for (let col = decoded.s.c; col <= decoded.e.c; col++) {
          const ref = XLSX.utils.encode_cell({ r: row, c: col });
          if (sheet[ref]) sheet[ref].s = { ...sheet[ref].s, ...style };
        }
      }
    };

    const headerStyle: ExcelCellStyle = {
      fill: { fgColor: { rgb: '4F46E5' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };

    const subHeaderStyle: ExcelCellStyle = {
      fill: { fgColor: { rgb: 'EEF2FF' } },
      font: { bold: true, color: { rgb: '3730A3' } },
    };

    [coverSheet, summarySheet, gradesSheet, attendanceSheet, activitySheet, accumulatedSheet].forEach(sheet => {
      const width = 12;
      sheet['!cols'] = Array.from({ length: width }, () => ({ wch: 16 }));
    });

    styleRange(coverSheet, 'A1:D5', subHeaderStyle);
    styleRange(summarySheet, 'A1:E1', headerStyle);
    styleRange(gradesSheet, `A1:${XLSX.utils.encode_col(gradesRows[0].length - 1)}1`, headerStyle);
    styleRange(attendanceSheet, 'A1:G1', headerStyle);
    styleRange(activitySheet, 'A1:D1', headerStyle);
    styleRange(accumulatedSheet, 'A1:H1', headerStyle);

    XLSX.utils.book_append_sheet(wb, coverSheet, 'Portada');
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(wb, gradesSheet, 'Calificaciones');
    XLSX.utils.book_append_sheet(wb, attendanceSheet, 'Asistencia');
    XLSX.utils.book_append_sheet(wb, activitySheet, 'Actividades');
    XLSX.utils.book_append_sheet(wb, accumulatedSheet, 'Acumulado año');

    XLSX.writeFile(wb, `Reporte_${selectedClass?.name ?? 'Clase'}_Periodo_${period.periodNumber}_${date}.xlsx`);
    toast.success('Reporte exportado correctamente');
  };

  if (!classes.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        Crea una clase para comenzar a configurar periodos.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Periodos</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Configura las fechas de cada periodo académico</p>
        </div>

        {activePeriod && (
          <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', fontWeight: '600' }}>
            Periodo activo: {activePeriod.periodNumber}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
          Seleccionar Clase
        </label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
        >
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name} — {cls.subject}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {[1, 2, 3, 4].map((number) => {
          const period = periods.find(item => item.periodNumber === number);
          const status = period ? getPeriodStatus(period) : 'pendiente';

          return (
            <div key={number} style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: statusColors[status], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={24} color="white" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Periodo {number}</h2>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', color: 'white', background: statusColors[status] }}>
                      {statusLabels[status]}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <div>Inicio: <strong style={{ color: 'var(--text-primary)' }}>{period ? formatDate(period.startDate) : 'Sin configurar'}</strong></div>
                <div>Final: <strong style={{ color: 'var(--text-primary)' }}>{period ? formatDate(period.endDate) : 'Sin configurar'}</strong></div>
                <div>Actividades: <strong style={{ color: 'var(--text-primary)' }}>{period ? getPeriodActivities(period).length : 0}</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => openCreate(number as 1 | 2 | 3 | 4)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--accent-primary)', color: 'var(--accent-text)', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Plus size={18} />
                  {period ? 'Editar' : 'Configurar'}
                </button>

                {period && (
                  <>
                    <button
                      onClick={() => exportPeriodReport(period)}
                      disabled={students.length === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: students.length > 0 ? '#10b981' : 'var(--bg-tertiary)', color: students.length > 0 ? 'white' : 'var(--text-muted)', fontWeight: '600', cursor: students.length > 0 ? 'pointer' : 'not-allowed' }}
                      title="Exportar reporte del periodo"
                    >
                      <Download size={18} />
                    </button>

                    {!period.isClosed && (
                      <button
                        onClick={() => handleClose(period)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                        title="Cerrar periodo"
                      >
                        <Lock size={18} />
                      </button>
                    )}

                    {period.isClosed && (
                      <button
                        onClick={() => handleClose(period)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: '600', cursor: 'not-allowed' }}
                        title="Periodo cerrado"
                      >
                        <Unlock size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(period)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'var(--bg-tertiary)', color: 'var(--danger)', fontWeight: '600', cursor: 'pointer' }}
                      title="Eliminar periodo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedClassId && students.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>Acumulado del año</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Promedio de periodos cerrados y nota necesaria para alcanzar 33.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr>
                  {['Estudiante', 'P1', 'P2', 'P3', 'P4', 'Promedio acumulado', 'Estado año', 'Nota necesaria'].map(header => (
                    <th key={header} style={{ padding: '14px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const completed = getClosedPeriodAverages(student.id);
                  const currentSum = completed.reduce((sum, item) => sum + Number(item.average), 0);
                  const accumulated = completed.length === 0 ? '-' : (currentSum / completed.length).toFixed(1);
                  const needed = getNeededNextAverage(student.id);
                  const status = accumulated === '-' ? '-' : Number(accumulated) >= PASSING_AVERAGE ? 'Va aprobando' : 'Va reprobando';

                  return (
                    <tr key={student.id} style={{ animation: 'fadeIn 0.3s ease forwards', animationDelay: `${index * 40}ms` }}>
                      <td style={{ padding: '14px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '500' }}>{student.name} {student.lastName}</td>
                      {[1, 2, 3, 4].map(number => {
                        const period = periods.find(item => item.periodNumber === number);
                        const average = period ? getStudentPeriodAverage(student.id, getPeriodActivities(period)) ?? '-' : '-';
                        return <td key={number} style={{ padding: '14px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{average}</td>;
                      })}
                      <td style={{ padding: '14px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: accumulated === '-' ? 'var(--text-muted)' : Number(accumulated) >= PASSING_AVERAGE ? '#10b981' : '#ef4444' }}>{accumulated}</td>
                      <td style={{ padding: '14px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: status === 'Va aprobando' ? '#10b981' : status === 'Va reprobando' ? '#ef4444' : 'var(--text-muted)' }}>{status}</td>
                      <td style={{ padding: '14px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: needed === null ? 'var(--text-muted)' : needed > MAX_SCORE ? '#ef4444' : '#f59e0b' }}>
                        {needed === null ? '-' : needed > MAX_SCORE ? 'Imposible con 50' : needed.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>{editingPeriod ? 'Editar periodo' : 'Configurar periodo'}</h2>
              <button onClick={() => setForm(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: '500', fontSize: '14px' }}>Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: '500', fontSize: '14px' }}>Fecha inicial</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)', fontWeight: '500', fontSize: '14px' }}>Fecha final</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setForm(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--accent-primary)', color: 'var(--accent-text)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Save size={18} />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
