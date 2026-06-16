import { useState, type FormEvent } from 'react';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onNavigateToRegister: () => void;
}

const LoginForm = ({ onLogin, onNavigateToRegister }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="login-page" style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
      <div className="login-card" style={{ background: 'rgba(15, 23, 42, 0.96)', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px -20px rgba(0, 0, 0, 0.65)', position: 'relative', borderRadius: '28px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', background: '#2563eb', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0 }}>ClassNest</h1>
          <p style={{ color: '#cbd5e1', marginTop: '8px', fontSize: '14px' }}>Gestiona tus clases de forma mas eficiente</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '10px' }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.2)', background: '#0f172a', color: 'white', fontSize: '15px' }}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '10px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.2)', background: '#0f172a', color: 'white', fontSize: '15px' }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password}
            style={{ width: '100%', padding: '14px', borderRadius: '16px', background: email && password ? '#3b82f6' : '#334155', color: 'white', border: 'none', fontSize: '16px', fontWeight: '700', cursor: email && password ? 'pointer' : 'not-allowed' }}
          >
            Entrar
          </button>

          <div style={{ textAlign: 'center', marginTop: '4px', color: '#94a3b8', fontSize: '14px' }}>
            ¿No tienes cuenta? <button type="button" onClick={onNavigateToRegister} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '700' }}>Regístrate aquí</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;