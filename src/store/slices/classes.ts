import type { StateCreator } from 'zustand';
import type { Class, DiaryEntry, ScheduleBlock, Activity, Grade, Attendance, Student } from '../../types';

export interface ClassesSlice {
  classes: Class[];
  diaryEntries: DiaryEntry[];
  schedule: ScheduleBlock[];
  activities: Activity[];
  grades: Grade[];
  attendance: Attendance[];
  addClass: (classData: Omit<Class, 'id'>) => void;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  getClasses: () => Class[];
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => void;
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => void;
  removeScheduleBlock: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivitiesByClass: (classId: string) => Activity[];
  setAttendance: (attendance: Omit<Attendance, 'id'>) => void;
  getAttendanceByDateAndClass: (date: string, classId: string) => Attendance[];
  setGrade: (grade: Omit<Grade, 'id'>) => void;
  getGradesByActivity: (activityId: string) => Grade[];
  getGradesByStudent: (studentId: string) => Grade[];
}

export const createClassesSlice: StateCreator<ClassesSlice & Record<string, unknown>> = (set, get) => ({
  classes: [],
  diaryEntries: [],
  schedule: [],
  activities: [],
  grades: [],
  attendance: [],
  addClass: (classData) => {
    const newClass: Class = { ...classData, id: Math.random().toString(36).substring(2, 15) };
    set({ classes: [...get().classes, newClass] });
  },
  updateClass: (id, classData) => {
    set({ classes: get().classes.map(c => c.id === id ? { ...c, ...classData } : c) });
  },
  deleteClass: (id) => {
    set({
      classes: get().classes.filter(c => c.id !== id),
      students: (get().students as Student[]).filter(s => s.classId !== id),
      attendance: (get().attendance as Attendance[]).filter(a => a.classId !== id),
      diaryEntries: (get().diaryEntries as DiaryEntry[]).filter(d => d.classId !== id),
      schedule: (get().schedule as ScheduleBlock[]).filter(s => s.classId !== id),
    });
  },
  getClasses: () => get().classes,
  addDiaryEntry: (entry) => {
    const newEntry: DiaryEntry = { ...entry, id: Math.random().toString(36).substring(2, 15) };
    set({ diaryEntries: [...get().diaryEntries, newEntry] });
  },
  addScheduleBlock: (block) => {
    const newBlock: ScheduleBlock = { ...block, id: Math.random().toString(36).substring(2, 15) };
    set({ schedule: [...get().schedule, newBlock] });
  },
  removeScheduleBlock: (id) => {
    set({ schedule: get().schedule.filter(b => b.id !== id) });
  },
  addActivity: (activity) => {
    const newActivity: Activity = { ...activity, id: Math.random().toString(36).substring(2, 15) };
    set({ activities: [...get().activities, newActivity] });
  },
  updateActivity: (id, activity) => {
    set({ activities: get().activities.map(a => a.id === id ? { ...a, ...activity } : a) });
  },
  deleteActivity: (id) => {
    set({
      activities: get().activities.filter(a => a.id !== id),
      grades: (get().grades as Grade[]).filter(g => g.activityId !== id),
    });
  },
  getActivitiesByClass: (classId) => get().activities.filter(a => a.classId === classId),
  setAttendance: (attendance) => {
    set((state) => {
      const existing = state.attendance.find(
        (a: Attendance) => a.studentId === attendance.studentId && a.date === attendance.date && a.classId === attendance.classId
      );
      if (existing) {
        return {
          attendance: state.attendance.map((a: Attendance) =>
            a.id === existing.id ? { ...a, status: attendance.status, comment: attendance.comment } : a
          ),
        };
      }
      return { attendance: [...state.attendance, { ...attendance, id: Math.random().toString(36).substring(2, 15) }] };
    });
  },
  getAttendanceByDateAndClass: (date, classId) => get().attendance.filter((a: Attendance) => a.date === date && a.classId === classId),
  setGrade: (grade) => {
    set((state) => {
      const existing = state.grades.find(
        (g: Grade) => g.activityId === grade.activityId && g.studentId === grade.studentId
      );
      if (existing) {
        return {
          grades: state.grades.map((g: Grade) =>
            g.id === existing.id ? { ...g, score: grade.score, comment: grade.comment } : g
          ),
        };
      }
      return { grades: [...state.grades, { ...grade, id: Math.random().toString(36).substring(2, 15) }] };
    });
  },
  getGradesByActivity: (activityId) => get().grades.filter((g: Grade) => g.activityId === activityId),
  getGradesByStudent: (studentId) => get().grades.filter((g: Grade) => g.studentId === studentId),
});
