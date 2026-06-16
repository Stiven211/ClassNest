import type { StateCreator } from 'zustand';
import type { Student, Attendance } from '../../types';

export interface StudentsSlice {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentsByClass: (classId: string) => Student[];
}

export const createStudentsSlice: StateCreator<StudentsSlice & Record<string, unknown>> = (set, get) => ({
  students: [],
  addStudent: (student) => {
    const newStudent: Student = { ...student, id: Math.random().toString(36).substring(2, 15) };
    set({ students: [...get().students, newStudent] });
  },
  updateStudent: (id, student) => {
    set({ students: get().students.map(s => s.id === id ? { ...s, ...student } : s) });
  },
  deleteStudent: (id) => {
    set({
      students: get().students.filter(s => s.id !== id),
      attendance: (get().attendance as Attendance[]).filter(a => a.studentId !== id),
    });
  },
  getStudentsByClass: (classId) => get().students.filter(s => s.classId === classId),
});
