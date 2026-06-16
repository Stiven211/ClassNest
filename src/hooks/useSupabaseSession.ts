import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/supabase-store';

export const useSupabaseSession = () => {
  const user = useAppStore((s) => s.user);
  const loadSession = useAppStore((s) => s.loadSession);
  const navigate = useNavigate();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return user;
};