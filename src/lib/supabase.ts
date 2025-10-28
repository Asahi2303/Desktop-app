import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dddkvozqqyibxhjxvnvg.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZGt2b3pxcXlpYnhoanh2bnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMjI4NTYsImV4cCI6MjA3NTc5ODg1Nn0.gh1Bu5eLggjfQyObA27yOQ7tMu8_PJSmXHNNYxzw4D0';

// Create Supabase client without strict typing for now
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          grade: string;
          section: string;
          status: 'Active' | 'Inactive' | 'Graduated';
          enrollment_date: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          first_name: string;
          last_name: string;
          email: string;
          grade: string;
          section: string;
          status?: 'Active' | 'Inactive' | 'Graduated';
          enrollment_date: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          first_name?: string;
          last_name?: string;
          email?: string;
          grade?: string;
          section?: string;
          status?: 'Active' | 'Inactive' | 'Graduated';
          enrollment_date?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          role: string;
          department: string;
          phone?: string;
          hire_date: string;
          status: 'Active' | 'Inactive';
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          first_name: string;
          last_name: string;
          email: string;
          role: string;
          department: string;
          phone?: string;
          hire_date: string;
          status?: 'Active' | 'Inactive';
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          first_name?: string;
          last_name?: string;
          email?: string;
          role?: string;
          department?: string;
          phone?: string;
          hire_date?: string;
          status?: 'Active' | 'Inactive';
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: number;
          student_id: number;
          date: string;
          status: 'Present' | 'Absent' | 'Late' | 'Excused';
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          student_id: number;
          date: string;
          status: 'Present' | 'Absent' | 'Late' | 'Excused';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          student_id?: number;
          date?: string;
          status?: 'Present' | 'Absent' | 'Late' | 'Excused';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: number;
          student_id: number;
          subject: string;
          grade: number;
          max_grade: number;
          semester: string;
          academic_year: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          student_id: number;
          subject: string;
          grade: number;
          max_grade: number;
          semester: string;
          academic_year: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          student_id?: number;
          subject?: string;
          grade?: number;
          max_grade?: number;
          semester?: string;
          academic_year?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: number;
          key: string;
          value: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          key: string;
          value: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          key?: string;
          value?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Type-safe client (will be used once database is set up)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
