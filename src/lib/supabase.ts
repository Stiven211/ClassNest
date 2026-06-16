import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name?: string;
          grades?: string[];
          subject?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string;
          grades?: string[];
          subject?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          grades?: string[];
          subject?: string;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          subject: string;
          grade?: string;
          color?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          subject: string;
          grade?: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          subject?: string;
          grade?: string;
          color?: string;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          name: string;
          lastName: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          name: string;
          lastName: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          name?: string;
          lastName?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          student_id: string;
          date: string;
          status: 'presente' | 'ausente' | 'ausencia_justificada' | 'retraso_justificado';
          comment?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          student_id: string;
          date: string;
          status: 'presente' | 'ausente' | 'ausencia_justificada' | 'retraso_justificado';
          comment?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          student_id?: string;
          date?: string;
          status?: 'presente' | 'ausente' | 'ausencia_justificada' | 'retraso_justificado';
          comment?: string;
          created_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          student_id: string;
          score: number;
          comment?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: string;
          student_id: string;
          score: number;
          comment?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string;
          student_id?: string;
          score?: number;
          comment?: string;
          created_at?: string;
        };
      };
      schedule_blocks: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          day: number;
          start_hour: number;
          end_hour: number;
          room?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          day: number;
          start_hour: number;
          end_hour: number;
          room?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          day?: number;
          start_hour?: number;
          end_hour?: number;
          room?: string;
          created_at?: string;
        };
      };
      diary_entries: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          date: string;
          title: string;
          content?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          date: string;
          title: string;
          content?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          date?: string;
          title?: string;
          content?: string;
          created_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          name: string;
          type: string;
          date?: string;
          max_score?: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          name: string;
          type: string;
          date?: string;
          max_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          name?: string;
          type?: string;
          date?: string;
          max_score?: number;
          created_at?: string;
        };
      };
    };
  };
};