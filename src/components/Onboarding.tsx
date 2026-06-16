import { useState, type CSSProperties } from 'react';
import { Users, ClipboardCheck, FileText, CalendarDays, X, GraduationCap } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: GraduationCap,
    title: 'Bienvenido a ClassNest',
    desc: 'Tu asistente para gestionar clases, asistencia y calificaciones.',
    content: 'Organiza tu día a día docente de forma eficiente y sencilla.'
  },
  {
    icon: Users,
    title: 'Importa tus Alumnos',
    desc: 'Ve a la sección Alumnos e importa desde Excel.',
    content: 'Sube un archivo con los datos de tus estudiantes (columnas: apellidos y nombres).'
  },
  {
    icon: ClipboardCheck,
    title: 'Toma Asistencia',
    desc: 'Usa el modo Llamar Lista para registrar.',
    content: 'Marca presente, ausente o justificado para cada alumno rápidamente.'
  },
  {
    icon: FileText,
    title: 'Gestiona Notas',
    desc: 'Crea actividades y registra calificaciones.',
    content: 'Organiza evaluaciones y sigue el progreso académico.'
  },
  {
    icon: CalendarDays,
    title: 'Organiza tu Horario',
    desc: 'Configura clases de la semana.',
    content: 'Planifica horarios respetando descansos (8:20-8:40 y 10:30-10:40).'
  }
];

const staggerDelay = (index: number) => ({
  animationDelay: `${index * 100}ms`,
});

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('classnest_onboarding_done', 'true');
    }
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        maxWidth: '480px',
        width: '100%',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.2s ease forwards',
        pointerEvents: 'auto',
      } as CSSProperties}>
          <button
            type="button"
            onClick={handleComplete}
            aria-label="Saltar introducción"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease',
            }}
          >
            <X size={20} />
          </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--accent-primary)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            {(() => {
              const Icon = steps[currentStep].icon;
              return <Icon size={28} color="white" aria-hidden="true" />;
            })()}
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
          }}>
            {steps[currentStep].title}
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: 0,
          }}>
            {steps[currentStep].desc}
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
        }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {steps[currentStep].content}
          </p>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: index === currentStep
                    ? 'var(--accent-primary)'
                    : index < currentStep
                      ? 'var(--accent-primary)80'
                      : 'var(--bg-tertiary)',
                  opacity: index === currentStep ? 1 : 0.5,
                  animation: 'fadeIn 0.3s ease forwards',
                  ...staggerDelay(index),
                } as CSSProperties}
              />
            ))}
          </div>
          <span style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            {currentStep + 1} de {steps.length}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '8px 0',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--accent-primary)',
              }}
            />
            No volver a mostrar
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={prevStep}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: currentStep === 0 ? 0.5 : 1,
              touchAction: 'manipulation',
            }}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={nextStep}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              touchAction: 'manipulation',
            }}
          >
            <span>{currentStep === steps.length - 1 ? 'Comenzar' : 'Siguiente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}