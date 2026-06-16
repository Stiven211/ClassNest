export interface User {
  id: string;
  name?: string;
  email: string;
  grades?: string[];
  subject?: string;
}

export interface Class {
   id: string;
   name: string;
   subject: string;
   grade?: string;
   color?: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  lastName: string;
}

export type AttendanceStatus = 'presente' | 'ausente' | 'ausencia_justificada' | 'retraso_justificado' | 'retirado';

export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  comment?: string;
}

export interface DiaryEntry {
  id: string;
  classId: string;
  date: string;
  title?: string;
  content: string;
}

export interface ScheduleBlock {
  id: string;
  classId: string;
  day: number;
  startHour: number;
  endHour: number;
}

export type ActivityType = 'tarea' | 'examen' | 'proyecto' | 'participacion' | 'otro';

export interface Activity {
  id: string;
  classId: string;
  periodId?: string;
  name: string;
  type: ActivityType;
  maxScore: number;
  date: string;
}

export interface Period {
  id: string;
  classId: string;
  periodNumber: 1 | 2 | 3 | 4;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedAt?: string;
}

export interface Grade {
  id: string;
  activityId: string;
  studentId: string;
  score: number | null;
  comment?: string;
}

export interface AppState {
  user: User | null;
  classes: Class[];
  students: Student[];
  attendance: Attendance[];
  diaryEntries: DiaryEntry[];
  schedule: ScheduleBlock[];
  activities: Activity[];
  periods: Period[];
  grades: Grade[];
  theme: 'light' | 'dark' | 'system';
}
