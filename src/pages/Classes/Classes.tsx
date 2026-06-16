import { useApp } from '../../store';
import { GraduationCap, Users, Plus, X } from 'lucide-react';
import { useState } from 'react';

export const Classes = () => {
  const { state, getStudentsByClass, addClass } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({ subject: '', grade: '' });
  const [filterRama, setFilterRama] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  const handleAddClass = async () => {
    if (!newClass.subject || !newClass.grade || isCreatingClass) return;

    setIsCreatingClass(true);
    try {
      const created = await addClass({ name: newClass.grade, subject: newClass.subject, grade: newClass.grade });
      if (!created) return;
      setNewClass({ subject: '', grade: '' });
      setShowAddModal(false);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const grades = ['401', '402', '403', '404', '501', '502', '503', '504', '601', '602', '603', '604', '701', '702', '703', '801', '802', '803', '901', '902', '903', '1001', '1002', '1101', '1102', '1103'];

  const ramas = ['4', '5', '6', '7', '8', '9', '10', '11'];

  const filteredClasses = filterRama
    ? state.classes.filter(cls => cls.grade?.startsWith(filterRama))
    : state.classes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>Mis Clases</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona tus clases y grupos</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--accent-primary)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Agregar Clase
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginRight: '8px' }}>Filtrar por rama:</span>
        <button
          onClick={() => setFilterRama('')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: filterRama === '' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: filterRama === '' ? 'var(--accent-text)' : 'var(--text-primary)',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Todas
        </button>
        {ramas.map(rama => (
          <button
            key={rama}
            onClick={() => setFilterRama(rama)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: filterRama === rama ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: filterRama === rama ? 'var(--accent-text)' : 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {rama}°
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredClasses.map(cls => {
          const students = getStudentsByClass(cls.id);
          return (
            <div key={cls.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={24} color="var(--accent-primary)" />
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{cls.name}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{cls.subject} • {cls.grade}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <Users size={16} />
                <span>{students.length} alumnos</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <GraduationCap size={64} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {filterRama ? `No hay clases en la rama ${filterRama}°` : 'No hay clases creadas'}
          </p>
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Agregar Clase</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>Grupo</label>
                <select
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar grupo</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>Materia</label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  placeholder="Ej: Matemáticas"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddClass}
                  disabled={!newClass.grade || !newClass.subject || isCreatingClass}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: newClass.grade && newClass.subject && !isCreatingClass ? 'var(--accent-primary)' : 'var(--text-muted)',
                    color: 'var(--accent-text)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: newClass.grade && newClass.subject && !isCreatingClass ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isCreatingClass ? 'Creando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
