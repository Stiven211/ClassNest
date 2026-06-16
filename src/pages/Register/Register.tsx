import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const GRADES = ['401', '402', '403', '404', '501', '502', '503', '504', '601', '602', '603', '604', '701', '702', '703', '801', '802', '803', '901', '902', '903', '1001', '1002', '1101', '1102', '1103'];

const SUBJECTS = ['Matemáticas', 'Español', 'Inglés', 'Ciencias', 'Historia', 'Geografía', 'Educación Física', 'Arte', 'Música', 'Tecnología', 'Ética', 'Religión', 'Biología', 'Química', 'Física', 'Otro'];

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        subject: '',
        isGradeDirector: false,
        grade: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Nombre es requerido';
        if (!formData.email.trim()) newErrors.email = 'Email es requerido';
        if (!formData.password.trim()) newErrors.password = 'Contraseña es requerida';
        if (!formData.subject.trim()) newErrors.subject = 'Materia es requerida';
        if (formData.isGradeDirector && !formData.grade.trim()) newErrors.grade = 'Grado es requerido si eres director';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        subject: formData.subject,
                        grades: formData.isGradeDirector ? [formData.grade] : [],
                    }
                }
            });
            
            if (error) {
                const msg = error.message || '';
                if (msg.includes('rate_limit') || msg.includes('429') || msg.includes('Too Many')) {
                    toast.error('Demasiados intentos. Espera unos minutos antes de registrarte.');
                } else if (msg.includes('already registered')) {
                    toast.error('Este email ya está registrado. Intenta iniciar sesión.');
                } else {
                    toast.error(msg);
                }
            } else {
                toast.success('Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.');
                navigate('/');
            }
        } catch {
            toast.error('Error al crear la cuenta. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.96)',
                borderRadius: '28px',
                padding: '34px',
                width: '100%',
                maxWidth: '420px',
                border: '1px solid rgba(148,163,184,0.16)',
                boxShadow: '0 25px 60px -20px rgba(0, 0, 0, 0.7)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: '#2563eb', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <span style={{ color: 'white', fontSize: '26px' }}>✓</span>
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                        Crear tu cuenta
                    </h1>
                    <p style={{ color: '#cbd5e1', fontSize: '14px' }}>Regístrate como profesor y configura tu grado si eres director</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}
                            placeholder="Tu nombre completo"
                        />
                        {errors.name && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}
                            placeholder="tu@email.com"
                        />
                        {errors.email && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    paddingRight: '40px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                                placeholder="Tu contraseña"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Materia
                        </label>
                        <select
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}
                        >
                            <option value="">Selecciona una materia</option>
                            {SUBJECTS.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        {errors.subject && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.subject}</p>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            <input
                                type="checkbox"
                                checked={formData.isGradeDirector}
                                onChange={(e) => setFormData(prev => ({ ...prev, isGradeDirector: e.target.checked, grade: e.target.checked ? prev.grade : '' }))}
                                style={{ marginRight: '8px' }}
                            />
                            ¿Eres director de grado?
                        </label>
                    </div>

                    {formData.isGradeDirector && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                Grado que diriges
                            </label>
                            <select
                                value={formData.grade}
                                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Selecciona un grado</option>
                                {GRADES.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                            {errors.grade && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.grade}</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '16px',
                            background: isLoading ? '#64748b' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            marginBottom: '16px'
                        }}
                    >
                        {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '16px',
                            background: 'transparent',
                            color: '#cbd5e1',
                            border: '1px solid rgba(148,163,184,0.3)',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Ya tengo cuenta - Iniciar sesión
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;