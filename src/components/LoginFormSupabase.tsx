import { useState, type FormEvent, memo, useCallback } from 'react';
import { BookOpen, Eye, EyeOff, Mail } from 'lucide-react';
import { useApp } from '../store';

interface LoginFormProps {
  onNavigateToRegister: () => void;
}

const LoginForm = memo(({ onNavigateToRegister }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isMagicLinkMode, setIsMagicLinkMode] = useState(false);

  const { login, loginWithMagicLink, isLoading, error } = useApp();

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (isMagicLinkMode) {
      await loginWithMagicLink(email);
    } else {
      if (email && password) {
        await login(email, password);
      }
    }
  }, [email, password, isMagicLinkMode, login, loginWithMagicLink]);

  return (
    <div className="login-page" style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
      <div className="login-card" style={{ background: 'rgba(15, 23, 42, 0.96)', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px -20px rgba(0, 0, 0, 0.65)', position: 'relative', borderRadius: '28px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', background: '#2563eb', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0 }}>ClassNest</h1>
          <p style={{ color: '#cbd5e1', marginTop: '8px', fontSize: '14px' }}>
            {isMagicLinkMode ? 'Ingresa tu email para recibir el enlace' : 'Gestiona tus clases de forma mas eficiente'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '12px', background: '#ef444422', color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

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

          {!isMagicLinkMode && (
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
          )}

          <button
            type="submit"
            disabled={!email || isLoading}
            style={{ width: '100%', padding: '14px', borderRadius: '16px', background: email ? '#3b82f6' : '#334155', color: 'white', border: 'none', fontSize: '16px', fontWeight: '700', cursor: email ? 'pointer' : 'not-allowed' }}
          >
            {isLoading ? 'Cargando...' : isMagicLinkMode ? 'Enviar enlace mágico' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={() => setIsMagicLinkMode(!isMagicLinkMode)}
            style={{ width: '100%', padding: '12px', borderRadius: '16px', background: 'transparent', color: '#64748b', border: '1px solid #334155', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Mail size={16} />
            {isMagicLinkMode ? 'Usar contraseña' : 'Usar enlace mágico'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '4px', color: '#94a3b8', fontSize: '14px' }}>
            ¿No tienes cuenta? <button type="button" onClick={onNavigateToRegister} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '700' }}>Regístrate aquí</button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default LoginForm;