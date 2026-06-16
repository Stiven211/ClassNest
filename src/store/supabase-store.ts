/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { AppState, Class, Student, Attendance, DiaryEntry, ScheduleBlock, Activity, Grade, User, Period } from '../types';

const formatSupabaseError = (error: unknown) => {
  if (!error) return 'Error desconocido';
  const err = error as { message?: string; details?: string; hint?: string };
  return err.details || err.hint || err.message || 'Error desconocido';
};

const ensureUserRow = async (user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}) => {
  const emailName = user.email ? user.email.split('@')[0] : 'Profesor';
  const metadata = user.user_metadata || {};
  const grades = Array.isArray(metadata.grades) ? metadata.grades : [];

  const { error } = await supabase.from('users').upsert({
    id: user.id,
    email: user.email || '',
    name: metadata.name || metadata.full_name || emailName,
    grades,
    subject: metadata.subject || '',
  }, { onConflict: 'id', defaultToNull: false });

  return error ? formatSupabaseError(error) : null;
};

const toAppStudent = (student: any): Student => ({
  id: student.id.toString(),
  classId: student.class_id,
  name: student.name,
  lastName: student.lastName,
});

const toDbStudent = (student: Omit<Student, 'id'>) => ({
  class_id: student.classId,
  name: student.name,
  lastName: student.lastName,
});

const toAppAttendance = (attendance: any): Attendance => ({
  id: attendance.id.toString(),
  classId: attendance.class_id,
  studentId: attendance.student_id,
  date: attendance.date,
  status: attendance.status,
  comment: attendance.comment,
});

const toDbAttendance = (attendance: Omit<Attendance, 'id'>) => ({
  class_id: attendance.classId,
  student_id: attendance.studentId,
  date: attendance.date,
  status: attendance.status,
  comment: attendance.comment,
});

const toAppScheduleBlock = (block: any): ScheduleBlock => ({
  id: block.id.toString(),
  classId: block.class_id,
  day: block.day,
  startHour: Number(block.start_hour),
  endHour: Number(block.end_hour),
});

const toDbScheduleBlock = (block: Omit<ScheduleBlock, 'id'>) => ({
  class_id: block.classId,
  day: block.day,
  start_hour: block.startHour,
  end_hour: block.endHour,
});

const toAppDiaryEntry = (entry: any): DiaryEntry => ({
  id: entry.id.toString(),
  classId: entry.class_id,
  date: entry.date,
  title: entry.title,
  content: entry.content,
});

const toDbDiaryEntry = (entry: Omit<DiaryEntry, 'id'>) => ({
  class_id: entry.classId,
  date: entry.date,
  title: entry.title,
  content: entry.content,
});

const toAppActivity = (activity: any): Activity => ({
  id: activity.id.toString(),
  classId: activity.class_id,
  periodId: activity.period_id?.toString(),
  name: activity.name,
  type: activity.type,
  date: activity.date,
  maxScore: activity.max_score,
});

const toAppPeriod = (period: any): Period => ({
  id: period.id.toString(),
  classId: period.class_id,
  periodNumber: period.period_number,
  name: period.name,
  startDate: period.start_date,
  endDate: period.end_date,
  isClosed: period.is_closed,
  closedAt: period.closed_at,
});

const toDbPeriod = (period: Omit<Period, 'id' | 'isClosed' | 'closedAt'>) => ({
  class_id: period.classId,
  period_number: period.periodNumber,
  name: period.name,
  start_date: period.startDate,
  end_date: period.endDate,
});

const toDbActivity = (activity: Omit<Activity, 'id'>) => ({
  class_id: activity.classId,
  period_id: activity.periodId,
  name: activity.name,
  type: activity.type,
  date: activity.date,
  max_score: activity.maxScore,
});

const toAppGrade = (grade: any): Grade => ({
  id: grade.id.toString(),
  activityId: grade.activity_id,
  studentId: grade.student_id,
  score: grade.score,
  comment: grade.comment,
});

const toDbGrade = (grade: Omit<Grade, 'id'>) => ({
  activity_id: grade.activityId,
  student_id: grade.studentId,
  score: grade.score,
  comment: grade.comment,
});

const gradeSaveQueues = new Map<string, Promise<boolean>>();

const THEME_STORAGE_KEY = 'classnest_theme';

const getSavedTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'light';
};

const saveTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};

type AppStoreState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  classes: Class[];
  diaryEntries: DiaryEntry[];
  schedule: ScheduleBlock[];
  activities: Activity[];
  periods: Period[];
  students: Student[];
  attendance: Attendance[];
  grades: Grade[];
  theme: 'light' | 'dark' | 'system';
  isSupabaseReady: boolean;
};

const initialState: AppStoreState = {
  user: null,
  isLoading: false,
  error: null,
  classes: [],
  diaryEntries: [],
  schedule: [],
  activities: [],
  periods: [],
  students: [],
  attendance: [],
  grades: [],
  theme: getSavedTheme(),
  isSupabaseReady: false,
};

export const useAppStore = create<AppStoreState & {
  login: (email: string, password: string, grades?: string[], subject?: string, name?: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  addClass: (classData: Omit<Class, 'id'>) => Promise<boolean>;
  updateClass: (id: string, classData: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  getClasses: () => Class[];
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<void>;
  updateDiaryEntry: (id: string, entry: Partial<Omit<DiaryEntry, 'id'>>) => Promise<void>;
  deleteDiaryEntry: (id: string) => Promise<void>;
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<void>;
  removeScheduleBlock: (id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<boolean>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  getActivitiesByClass: (classId: string) => Activity[];
  addPeriod: (period: Omit<Period, 'id' | 'isClosed' | 'closedAt'>) => Promise<boolean>;
  updatePeriod: (id: string, period: Partial<Period>) => Promise<boolean>;
  closePeriod: (id: string) => Promise<boolean>;
  deletePeriod: (id: string) => Promise<void>;
  getPeriodsByClass: (classId: string) => Period[];
  getActivePeriodByClass: (classId: string) => Period | undefined;
  getPeriodStatus: (period: Period) => 'pendiente' | 'activo' | 'cerrado';
  addStudent: (student: Omit<Student, 'id'>) => Promise<boolean>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  getStudentsByClass: (classId: string) => Student[];
  setAttendance: (attendance: Omit<Attendance, 'id'>) => Promise<void>;
  getAttendanceByDateAndClass: (date: string, classId: string) => Attendance[];
  setGrade: (grade: Omit<Grade, 'id'>) => Promise<boolean>;
  getGradesByActivity: (activityId: string) => Grade[];
  getGradesByStudent: (studentId: string) => Grade[];
  resetStore: () => void;
  toggleTheme: () => void;
  loadSession: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}>()(
  (set, get) => {
    return {
      ...initialState,

      loadSession: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userMetadata = user.user_metadata;
          const emailName = user.email ? user.email.split('@')[0] : 'Profesor';
          const ensureError = await ensureUserRow(user);
          if (ensureError) {
            set({ error: ensureError, isLoading: false });
            toast.error(ensureError);
            return;
          }
          set({
            user: {
              id: user.id,
              email: user.email || '',
              name: userMetadata?.name || userMetadata?.full_name || emailName,
              grades: userMetadata?.grades || [],
              subject: userMetadata?.subject || ''
            }
          });
          await get().loadFromSupabase();
        }
      },

      loadFromSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userId = user.id;

        const [classesRes, studentsRes, attendanceRes, gradesRes, scheduleRes, diaryRes, activitiesRes, periodsRes] = await Promise.all([
          supabase.from('classes').select('*').eq('user_id', userId),
          supabase.from('students').select('*').eq('user_id', userId),
          supabase.from('attendance').select('*').eq('user_id', userId),
          supabase.from('grades').select('*').eq('user_id', userId),
          supabase.from('schedule_blocks').select('*').eq('user_id', userId),
          supabase.from('diary_entries').select('*').eq('user_id', userId),
          supabase.from('activities').select('*').eq('user_id', userId),
          supabase.from('periods').select('*').eq('user_id', userId),
        ]);

        set({
          classes: (classesRes.data || []).map(c => ({ ...c, id: c.id.toString() })),
          students: (studentsRes.data || []).map(toAppStudent),
          attendance: (attendanceRes.data || []).map(toAppAttendance),
          grades: (gradesRes.data || []).map(toAppGrade),
          schedule: (scheduleRes.data || []).map(toAppScheduleBlock),
          diaryEntries: (diaryRes.data || []).map(toAppDiaryEntry),
          activities: (activitiesRes.data || []).map(toAppActivity),
          periods: (periodsRes.data || []).map(toAppPeriod),
          isSupabaseReady: true,
        });
      },

      login: async (email, password, grades = [], subject = '', name = '') => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;

          const user = data.user;
          if (user) {
            const ensureError = await ensureUserRow(user);
            if (ensureError) {
              set({ error: ensureError, isLoading: false });
              toast.error(ensureError);
              return;
            }
            await get().loadFromSupabase();
            set({
              user: {
                id: user.id,
                email: user.email || '',
                name: name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
                grades,
                subject: subject || user.user_metadata?.subject,
              },
              isLoading: false
            });
            toast.success('Sesión iniciada correctamente');
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      loginWithMagicLink: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin }
          });
          if (error) throw error;
          toast.success('Enlace mágico enviado. Revisa tu email.');
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          toast.error((error as Error).message);
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ ...initialState });
      },

      addClass: async (classData) => {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return false;

         const ensureError = await ensureUserRow(user);
         if (ensureError) {
           set({ error: ensureError });
           toast.error(ensureError);
           return false;
         }
         
         const duplicateKey = classData.grade || classData.name;
         const existsInStore = get().classes.some(c => c.grade === duplicateKey || c.name === duplicateKey);
         if (existsInStore) {
           toast.error(`Ya tienes una clase registrada para el grupo ${duplicateKey}`);
           return false;
         }

         const { data: existing, error: existingError } = await supabase
           .from('classes')
           .select('id')
           .eq('user_id', user.id)
           .eq('grade', duplicateKey)
           .limit(1)
           .maybeSingle();

         if (existingError) {
           const message = formatSupabaseError(existingError);
           set({ error: message });
           toast.error(message);
           return false;
         }

         if (existing) {
           toast.error(`Ya tienes una clase registrada para el grupo ${duplicateKey}`);
           return false;
         }
         
         const { data, error } = await supabase.from('classes').insert({
           ...classData,
           user_id: user.id,
         }).select().single().retry(false);
         
         if (error) {
           const message = formatSupabaseError(error);
           set({ error: message });
           toast.error(message);
           return false;
         } else if (data) {
           set({ classes: [...get().classes, { ...data, id: data.id.toString() }] });
           toast.success('Clase creada correctamente');
           return true;
         }
         return false;
       },

      updateClass: async (id, classData) => {
        const { error } = await supabase.from('classes').update(classData).eq('id', id);
        if (error) set({ error: error.message });
        else set({ classes: get().classes.map(c => c.id === id ? { ...c, ...classData } : c) });
      },

      deleteClass: async (id) => {
        await supabase.from('classes').delete().eq('id', id);
        set({
          classes: get().classes.filter(c => c.id !== id),
          students: get().students.filter(s => s.classId !== id),
          attendance: get().attendance.filter(a => a.classId !== id),
          diaryEntries: get().diaryEntries.filter(d => d.classId !== id),
          schedule: get().schedule.filter(s => s.classId !== id),
          activities: get().activities.filter(a => a.classId !== id),
        });
      },

      getClasses: () => get().classes,

      addScheduleBlock: async (block) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('schedule_blocks').insert({
          ...toDbScheduleBlock(block),
          user_id: user.id,
        }).select().single().retry(false);
        if (error) set({ error: error.message });
        else if (data) set({ schedule: [...get().schedule, toAppScheduleBlock(data)] });
      },

      removeScheduleBlock: async (id) => {
        await supabase.from('schedule_blocks').delete().eq('id', id);
        set({ schedule: get().schedule.filter(b => b.id !== id) });
      },

      addActivity: async (activity) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const ensureError = await ensureUserRow(user);
        if (ensureError) {
          set({ error: ensureError });
          toast.error(ensureError);
          return false;
        }

        const existsInStore = get().activities.some(a =>
          a.classId === activity.classId && a.name.toLowerCase() === activity.name.toLowerCase()
        );

        if (existsInStore) {
          toast.error(`Ya existe una actividad llamada "${activity.name}" en esta clase`);
          return false;
        }

        const { data, error } = await supabase.from('activities').insert({
          ...toDbActivity(activity),
          user_id: user.id,
        }).select().single().retry(false);
        if (error) {
          const message = formatSupabaseError(error);
          set({ error: message });
          toast.error(message);
          return false;
        }
        if (data) set({ activities: [...get().activities, toAppActivity(data)] });
        return true;
      },

      updateActivity: async (id, activity) => {
        const current = get().activities.find(a => a.id === id);
        if (!current) return;

        const merged = { ...current, ...activity };
        const { error } = await supabase.from('activities').update(toDbActivity(merged)).eq('id', id);
        if (error) set({ error: error.message });
        else set({ activities: get().activities.map(a => a.id === id ? merged : a) });
      },

      deleteActivity: async (id) => {
        await supabase.from('activities').delete().eq('id', id);
        set({
          activities: get().activities.filter(a => a.id !== id),
          grades: get().grades.filter(g => g.activityId !== id),
        });
      },

      getActivitiesByClass: (classId) => get().activities.filter(a => a.classId === classId),

      addPeriod: async (period) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const ensureError = await ensureUserRow(user);
        if (ensureError) {
          set({ error: ensureError });
          toast.error(ensureError);
          return false;
        }

        const { data, error } = await supabase.from('periods').insert({
          ...toDbPeriod(period),
          user_id: user.id,
        }).select().single().retry(false);

        if (error) {
          const message = formatSupabaseError(error);
          set({ error: message });
          toast.error(message);
          return false;
        }

        if (data) set({ periods: [...get().periods, toAppPeriod(data)] });
        return true;
      },

      updatePeriod: async (id, period) => {
        const current = get().periods.find(p => p.id === id);
        if (!current) return false;

        const merged = { ...current, ...period } as Period;
        const { error } = await supabase.from('periods').update(toDbPeriod(merged)).eq('id', id).retry(false);
        if (error) {
          const message = formatSupabaseError(error);
          set({ error: message });
          toast.error(message);
          return false;
        }

        set({ periods: get().periods.map(p => p.id === id ? merged : p) });
        return true;
      },

      closePeriod: async (id) => {
        const current = get().periods.find(p => p.id === id);
        if (!current) return false;

        const { error } = await supabase.from('periods').update({
          is_closed: true,
          closed_at: new Date().toISOString(),
        }).eq('id', id).retry(false);

        if (error) {
          const message = formatSupabaseError(error);
          set({ error: message });
          toast.error(message);
          return false;
        }

        set({
          periods: get().periods.map(p => p.id === id ? { ...p, isClosed: true, closedAt: new Date().toISOString() } : p),
        });
        return true;
      },

      deletePeriod: async (id) => {
        await supabase.from('periods').delete().eq('id', id);
        set({
          periods: get().periods.filter(p => p.id !== id),
          activities: get().activities.map(a => a.periodId === id ? { ...a, periodId: undefined } : a),
        });
      },

      getPeriodsByClass: (classId) => get().periods.filter(p => p.classId === classId).sort((a, b) => a.periodNumber - b.periodNumber),

      getActivePeriodByClass: (classId) => {
        const today = new Date().toISOString().split('T')[0];
        return get().periods
          .filter(p => p.classId === classId && !p.isClosed && p.startDate <= today && p.endDate >= today)
          .sort((a, b) => a.periodNumber - b.periodNumber)[0];
      },

      getPeriodStatus: (period) => {
        if (period.isClosed) return 'cerrado';
        const today = new Date().toISOString().split('T')[0];
        if (period.startDate <= today && period.endDate >= today) return 'activo';
        return 'pendiente';
      },

      addStudent: async (student) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const ensureError = await ensureUserRow(user);
        if (ensureError) {
          set({ error: ensureError });
          toast.error(ensureError);
          return false;
        }

        const existsInStore = get().students.some(s =>
          s.classId === student.classId &&
          s.name.toLowerCase() === student.name.toLowerCase() &&
          s.lastName.toLowerCase() === student.lastName.toLowerCase()
        );

        if (existsInStore) {
          toast.error(`Ya existe un estudiante con ese nombre en esta clase`);
          return false;
        }

        const { data, error } = await supabase.from('students').insert({
          ...toDbStudent(student),
          user_id: user.id,
        }).select().single().retry(false);

        if (error) {
          const message = formatSupabaseError(error);
          set({ error: message });
          toast.error(message);
          return false;
        }

        if (data) set({ students: [...get().students, toAppStudent(data)] });
        return true;
      },

      updateStudent: async (id, student) => {
        const current = get().students.find(s => s.id === id);
        if (!current) return;

        const merged = { ...current, ...student };
        const { error } = await supabase.from('students').update(toDbStudent(merged)).eq('id', id);
        if (error) set({ error: error.message });
        else set({ students: get().students.map(s => s.id === id ? merged : s) });
      },

      deleteStudent: async (id) => {
        await supabase.from('students').delete().eq('id', id);
        set({
          students: get().students.filter(s => s.id !== id),
          attendance: get().attendance.filter(a => a.studentId !== id),
          grades: get().grades.filter(g => g.studentId !== id),
        });
      },

      getStudentsByClass: (classId) => get().students.filter(s => s.classId === classId),

      setAttendance: async (attendance) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const ensureError = await ensureUserRow(user);
        if (ensureError) {
          set({ error: ensureError });
          toast.error(ensureError);
          return;
        }

        const existing = get().attendance.find(a =>
          a.date === attendance.date &&
          a.classId === attendance.classId &&
          a.studentId === attendance.studentId
        );

        if (existing) {
          const { error } = await supabase.from('attendance').update({
            status: attendance.status,
            comment: attendance.comment,
          }).eq('id', existing.id);
          if (error) set({ error: error.message });
          else {
            set({
              attendance: get().attendance.map(a =>
                a.id === existing.id ? { ...a, status: attendance.status, comment: attendance.comment } : a
              ),
            });
          }
        } else {
          const { data, error } = await supabase.from('attendance').insert({
            ...toDbAttendance(attendance),
            user_id: user.id,
          }).select().single().retry(false);
          if (error) set({ error: error.message });
          else if (data) set({ attendance: [...get().attendance, toAppAttendance(data)] });
        }
      },

      getAttendanceByDateAndClass: (date, classId) => get().attendance.filter(a => a.date === date && a.classId === classId),

      setGrade: async (grade) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const queueKey = `${user.id}:${grade.activityId}:${grade.studentId}`;
        const previousSave = gradeSaveQueues.get(queueKey);

        const runSave = async () => {
          const ensureError = await ensureUserRow(user);
          if (ensureError) {
            set({ error: ensureError });
            toast.error(ensureError);
            return false;
          }

          const currentGrades = get().grades;
          const existing = currentGrades.find(
            g => g.activityId === grade.activityId && g.studentId === grade.studentId
          );
          const isPendingGrade = existing?.id.startsWith('temp-');
          const optimisticGrade: Grade = existing
            ? { ...existing, score: grade.score, comment: grade.comment }
            : {
                id: `temp-${grade.activityId}-${grade.studentId}`,
                activityId: grade.activityId,
                studentId: grade.studentId,
                score: grade.score,
                comment: grade.comment,
              };

          if (grade.score === null) {
            if (existing && !isPendingGrade) {
              const { error } = await supabase.from('grades').delete().eq('id', existing.id).retry(false);
              if (error) {
                const message = formatSupabaseError(error);
                set({ error: message });
                toast.error(message);
                return false;
              }
              set({ grades: currentGrades.filter(g => g.id !== existing.id) });
              return true;
            }

            set({ grades: currentGrades.filter(g => g.id !== optimisticGrade.id) });
            return true;
          }

          set({
            grades: existing
              ? currentGrades.map(g => g.id === existing.id ? optimisticGrade : g)
              : [...currentGrades, optimisticGrade],
          });

          if (existing && !isPendingGrade) {
            const { error } = await supabase.from('grades').update({
              score: grade.score,
              comment: grade.comment,
            }).eq('id', existing.id).retry(false);
            if (error) {
              const message = formatSupabaseError(error);
              set({ error: message, grades: currentGrades });
              toast.error(message);
              return false;
            }
            return true;
          }

          const { data, error } = await supabase.from('grades').upsert({
            ...toDbGrade(grade),
            user_id: user.id,
          }, { onConflict: 'user_id,activity_id,student_id' }).select().single().retry(false);

          if (error?.message?.includes('on conflict')) {
            const { data: insertData, error: insertError } = await supabase.from('grades').insert({
              ...toDbGrade(grade),
              user_id: user.id,
            }).select().single().retry(false);

            if ((insertError as { status?: number }).status === 409) {
              const { data: conflictGrade, error: conflictError } = await supabase
                .from('grades')
                .select('*')
                .eq('user_id', user.id)
                .eq('activity_id', grade.activityId)
                .eq('student_id', grade.studentId)
                .single();

              if (!conflictError && conflictGrade) {
                const { error: updateError } = await supabase
                  .from('grades')
                  .update({ score: grade.score, comment: grade.comment })
                  .eq('id', conflictGrade.id)
                  .retry(false);

                if (updateError) {
                  const message = formatSupabaseError(updateError);
                  set({ error: message, grades: currentGrades });
                  toast.error(message);
                  return false;
                }

                set({
                  grades: currentGrades.map(g =>
                    g.id === optimisticGrade.id ? toAppGrade(conflictGrade) : g
                  ),
                });
                return true;
              }
            }

            if (insertError) {
              const message = formatSupabaseError(insertError);
              set({ error: message, grades: currentGrades });
              toast.error(message);
              return false;
            }

            if (insertData) {
              set({ grades: currentGrades.map(g => g.id === optimisticGrade.id ? toAppGrade(insertData) : g) });
            }
            return true;
          }

          if (error) {
            const message = formatSupabaseError(error);
            set({ error: message, grades: currentGrades });
            toast.error(message);
            return false;
          }
          if (data) {
            set({ grades: currentGrades.map(g => g.id === optimisticGrade.id ? toAppGrade(data) : g) });
          }
          return true;
        };

        if (previousSave) {
          const chained = previousSave
            .catch(() => false)
            .then(() => get().setGrade(grade));
          const tracked = chained.finally(() => {
            if (gradeSaveQueues.get(queueKey) === tracked) {
              gradeSaveQueues.delete(queueKey);
            }
          });
          gradeSaveQueues.set(queueKey, tracked);
          return chained;
        }

        const run = runSave();
        const tracked = run.finally(() => {
          if (gradeSaveQueues.get(queueKey) === tracked) {
            gradeSaveQueues.delete(queueKey);
          }
        });
        gradeSaveQueues.set(queueKey, tracked);
        return run;
      },

      getGradesByActivity: (activityId) => get().grades.filter(g => g.activityId === activityId),
      getGradesByStudent: (studentId) => get().grades.filter(g => g.studentId === studentId),

      addDiaryEntry: async (entry) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('diary_entries').insert({
          ...toDbDiaryEntry(entry),
          user_id: user.id,
        }).select().single().retry(false);
        if (error) set({ error: error.message });
        else if (data) set({ diaryEntries: [...get().diaryEntries, toAppDiaryEntry(data)] });
      },

      updateDiaryEntry: async (id, entry) => {
        const current = get().diaryEntries.find(e => e.id === id);
        if (!current) return;

        const merged = { ...current, ...entry };
        const { error } = await supabase.from('diary_entries').update(toDbDiaryEntry(merged)).eq('id', id);
        if (error) set({ error: error.message });
        else set({ diaryEntries: get().diaryEntries.map(e => e.id === id ? merged : e) });
      },

      deleteDiaryEntry: async (id) => {
        await supabase.from('diary_entries').delete().eq('id', id);
        set({ diaryEntries: get().diaryEntries.filter(e => e.id !== id) });
      },

      toggleTheme: () => {
        set((state) => {
          const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(state.theme);
          const nextIndex = (currentIndex + 1) % themes.length;
            const nextTheme = themes[nextIndex];
            saveTheme(nextTheme);
            return { theme: nextTheme };
        });
      },

      resetStore: () => {
        set(initialState);
        localStorage.removeItem('classnest_onboarding_done');
      },
    };
  }
);

export interface AppContextType {
  state: AppState;
  isLoading: boolean;
  error: string | null;
  onNavigate: (page: string) => void;
  login: (email: string, password: string, grades?: string[], subject?: string, name?: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  addClass: (classData: Omit<Class, 'id'>) => Promise<boolean>;
  updateClass: (id: string, classData: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addStudent: (student: Omit<Student, 'id'>) => Promise<boolean>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  setAttendance: (attendance: Omit<Attendance, 'id'>) => Promise<void>;
  getAttendanceByDateAndClass: (date: string, classId: string) => Attendance[];
  addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<void>;
  updateDiaryEntry: (id: string, entry: Partial<Omit<DiaryEntry, 'id'>>) => Promise<void>;
  deleteDiaryEntry: (id: string) => Promise<void>;
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<void>;
  removeScheduleBlock: (id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<boolean>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  getActivitiesByClass: (classId: string) => Activity[];
  addPeriod: (period: Omit<Period, 'id' | 'isClosed' | 'closedAt'>) => Promise<boolean>;
  updatePeriod: (id: string, period: Partial<Period>) => Promise<boolean>;
  closePeriod: (id: string) => Promise<boolean>;
  deletePeriod: (id: string) => Promise<void>;
  getPeriodsByClass: (classId: string) => Period[];
  getActivePeriodByClass: (classId: string) => Period | undefined;
  getPeriodStatus: (period: Period) => 'pendiente' | 'activo' | 'cerrado';
  setGrade: (grade: Omit<Grade, 'id'>) => Promise<boolean>;
  getGradesByActivity: (activityId: string) => Grade[];
  getGradesByStudent: (studentId: string) => Grade[];
  resetStore: () => void;
  toggleTheme: () => void;
  getStudentsByClass: (classId: string) => Student[];
  getClasses: () => Class[];
}

export const useApp = (): AppContextType => {
  const user = useAppStore((s) => s.user);
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const attendance = useAppStore((s) => s.attendance);
  const diaryEntries = useAppStore((s) => s.diaryEntries);
  const schedule = useAppStore((s) => s.schedule);
  const activities = useAppStore((s) => s.activities);
  const periods = useAppStore((s) => s.periods);
  const grades = useAppStore((s) => s.grades);
  const theme = useAppStore((s) => s.theme);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);

  const appState: AppState = {
    user,
    classes,
    students,
    attendance,
    diaryEntries,
    schedule,
    activities,
    periods,
    grades,
    theme,
  };

  return {
    state: appState,
    isLoading,
    error,
    onNavigate: () => { },
    login: useAppStore((s) => s.login),
    loginWithMagicLink: useAppStore((s) => s.loginWithMagicLink),
    logout: useAppStore((s) => s.logout),
    addClass: useAppStore((s) => s.addClass),
    updateClass: useAppStore((s) => s.updateClass),
    deleteClass: useAppStore((s) => s.deleteClass),
    addStudent: useAppStore((s) => s.addStudent),
    updateStudent: useAppStore((s) => s.updateStudent),
    deleteStudent: useAppStore((s) => s.deleteStudent),
    setAttendance: useAppStore((s) => s.setAttendance),
    getAttendanceByDateAndClass: useAppStore((s) => s.getAttendanceByDateAndClass),
    addDiaryEntry: useAppStore((s) => s.addDiaryEntry),
    updateDiaryEntry: useAppStore((s) => s.updateDiaryEntry),
    deleteDiaryEntry: useAppStore((s) => s.deleteDiaryEntry),
    addScheduleBlock: useAppStore((s) => s.addScheduleBlock),
    removeScheduleBlock: useAppStore((s) => s.removeScheduleBlock),
    resetStore: useAppStore((s) => s.resetStore),
    toggleTheme: useAppStore((s) => s.toggleTheme),
    getStudentsByClass: useAppStore((s) => s.getStudentsByClass),
    getClasses: useAppStore((s) => s.getClasses),
    addActivity: useAppStore((s) => s.addActivity),
    updateActivity: useAppStore((s) => s.updateActivity),
    deleteActivity: useAppStore((s) => s.deleteActivity),
    addPeriod: useAppStore((s) => s.addPeriod),
    updatePeriod: useAppStore((s) => s.updatePeriod),
    closePeriod: useAppStore((s) => s.closePeriod),
    deletePeriod: useAppStore((s) => s.deletePeriod),
    getPeriodsByClass: useAppStore((s) => s.getPeriodsByClass),
    getActivePeriodByClass: useAppStore((s) => s.getActivePeriodByClass),
    getPeriodStatus: useAppStore((s) => s.getPeriodStatus),
    setGrade: useAppStore((s) => s.setGrade),
    getActivitiesByClass: useAppStore((s) => s.getActivitiesByClass),
    getGradesByActivity: useAppStore((s) => s.getGradesByActivity),
    getGradesByStudent: useAppStore((s) => s.getGradesByStudent),
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const hydratedRef = useRef(false);
  const loadSession = useAppStore((s) => s.loadSession);

  useEffect(() => {
    const init = async () => {
      if (!hydratedRef.current) {
        await loadSession();
        hydratedRef.current = true;
        setInitialized(true);
      }
    };
    init();
  }, [loadSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const userMetadata = session.user.user_metadata;
          useAppStore.setState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: userMetadata?.name,
              grades: userMetadata?.grades,
              subject: userMetadata?.subject
            }
          });
          await loadSession();
        } else {
          useAppStore.setState({ user: null, classes: [], students: [], attendance: [], grades: [], schedule: [], diaryEntries: [], activities: [], periods: [] });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadSession]);

  useEffect(() => {
    const applyTheme = () => {
      const state = useAppStore.getState();
      const root = document.documentElement;
      const isDark = state.theme === 'dark' ||
        (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const unsubscribe = useAppStore.subscribe((state) => {
      const isDark = state.theme === 'dark' ||
        (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    return unsubscribe;
  }, []);

  if (!initialized) {
    return null;
  }

  return children;
};