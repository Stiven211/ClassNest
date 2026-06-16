import { useCallback, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from './store/supabase-store';
import { Layout } from './components/Layout/Layout';
import LoginForm from './components/LoginFormSupabase';
import { Onboarding } from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Periods from './pages/Periods';
import Schedule from './pages/Schedule';
import Diary from './pages/Diary';
import Register from './pages/Register';

export default function App() {
   const navigate = useNavigate();
   const location = useLocation();
   const { state } = useApp();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const isFirstTime = !state.classes.length && !state.students.length;
  const hasCompletedOnboarding = typeof window !== 'undefined' 
    ? localStorage.getItem('classnest_onboarding_done') === 'true' 
    : false;
  const showOnboarding = state.user && isFirstTime && !hasCompletedOnboarding && !onboardingDismissed;

  const handleCompleteOnboarding = useCallback(() => {
    localStorage.setItem('classnest_onboarding_done', 'true');
    setOnboardingDismissed(true);
  }, []);

  const handleNavigateToRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  if (!state.user) {
    if (location.pathname === '/register') {
      return <Register />;
    }
    return <LoginForm onNavigateToRegister={handleNavigateToRegister} />;
  }

  return (
    <Layout>
      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/students" element={<Students />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/periods" element={<Periods />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Layout>
  );
}