import type { AppState, Class, Student } from '../types';

const STORAGE_KEY = 'classnest_data';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const defaultState: AppState = {
  user: null,
  classes: [],
  students: [],
  attendance: [],
  diaryEntries: [],
  schedule: [],
  activities: [],
  periods: [],
  grades: [],
  theme: getSystemTheme(),
};

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppState>;
      return {
        ...defaultState,
        ...parsed,
        theme: parsed.theme ?? 'light',
      };
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
  }
  return defaultState;
};

export const saveState = (state: AppState): void => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
};

export const resetData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

export const initializeSampleData = (): AppState => {
  const sampleClasses: Class[] = [
    { id: 'cls-401', name: '401', subject: 'Matemáticas', grade: '401' },
  ];

  const sampleStudents: Student[] = [
    { id: 'stu-01', classId: 'cls-401', name: 'Juan', lastName: 'Pérez' },
    { id: 'stu-02', classId: 'cls-401', name: 'María', lastName: 'García' },
    { id: 'stu-03', classId: 'cls-401', name: 'Carlos', lastName: 'López' },
    { id: 'stu-04', classId: 'cls-401', name: 'Ana', lastName: 'Rodríguez' },
    { id: 'stu-05', classId: 'cls-401', name: 'Luis', lastName: 'Martínez' },
  ];

  return {
    ...defaultState,
    classes: sampleClasses,
    students: sampleStudents,
  };
};