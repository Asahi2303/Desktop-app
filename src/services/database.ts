import { supabaseClient } from '../lib/supabase';

// Define types manually for now (will be replaced with generated types later)
export interface Student {
  id: number;
  first_name: string;
  suffix?: string | null;
  lrn?: string | null;
  last_name: string;
  full_name?: string | null;
  normalized_full_name?: string | null;
  email: string;
  grade: string;
  section: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  enrollment_date: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentInsert {
  id?: number;
  first_name: string;
  suffix?: string | null;
  lrn?: string | null;
  last_name: string;
  full_name?: string | null;
  normalized_full_name?: string | null;
  email: string;
  grade: string;
  section: string;
  status?: 'Active' | 'Inactive' | 'Graduated';
  enrollment_date: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentUpdate {
  id?: number;
  first_name?: string;
  suffix?: string | null;
  lrn?: string | null;
  last_name?: string;
  full_name?: string | null;
  normalized_full_name?: string | null;
  email?: string;
  grade?: string;
  section?: string;
  status?: 'Active' | 'Inactive' | 'Graduated';
  enrollment_date?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_id?: string; // optional link to users.id if stored in staff table
  role: string;
  department: string;
  phone?: string;
  hire_date: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffInsert {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  phone?: string;
  hire_date: string;
  status?: 'Active' | 'Inactive' | 'On Leave';
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffUpdate {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  department?: string;
  phone?: string;
  hire_date?: string;
  status?: 'Active' | 'Inactive' | 'On Leave';
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceInsert {
  id?: number;
  student_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceUpdate {
  id?: number;
  student_id?: number;
  date?: string;
  status?: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Grade {
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
}

export interface GradeInsert {
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
}

export interface GradeUpdate {
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
}


export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Teacher' | 'Staff';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id?: string;
  email: string;
  name: string;
  role: 'Admin' | 'Teacher' | 'Staff';
  password?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  id?: string;
  email?: string;
  name?: string;
  role?: 'Admin' | 'Teacher' | 'Staff';
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Classes (Sections/Schedules)
export interface ClassSchedule {
  id: number;
  name: string; // e.g., "Grade 5 - Section A"
  subject: string; // e.g., "Mathematics"
  teacher_id: string; // maps to users.id
  room?: string;
  day_of_week: number; // 0-6 (Sun-Sat)
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface ClassScheduleInsert {
  id?: number;
  name: string;
  subject: string;
  teacher_id: string;
  room?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  academic_year: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClassScheduleUpdate {
  id?: number;
  name?: string;
  subject?: string;
  teacher_id?: string;
  room?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  academic_year?: string;
  created_at?: string;
  updated_at?: string;
}

// Fallback data for when database is not set up
const getFallbackStudents = (): Student[] => {
  const students: Student[] = [];
  const firstNames = [
    'Sarah', 'Michael', 'Emily', 'James', 'Olivia', 'William', 'Ava', 'Benjamin', 'Sophia', 'Lucas',
    'Isabella', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Mason', 'Mia', 'Ethan', 'Harper', 'Noah',
    'Evelyn', 'Liam', 'Abigail', 'Oliver', 'Elizabeth', 'Sebastian', 'Sofia', 'Aiden', 'Avery', 'Jackson',
    'Ella', 'Logan', 'Madison', 'Caleb', 'Scarlett', 'Ryan', 'Victoria', 'Nathan', 'Aria', 'Owen',
    'Grace', 'Luke', 'Chloe', 'Gabriel', 'Camila', 'Isaac', 'Penelope', 'Anthony', 'Riley', 'Dylan',
    'Layla', 'Wyatt', 'Lillian', 'Andrew', 'Nora', 'Joshua', 'Zoey', 'Christopher', 'Mila', 'Grayson',
    'Aubrey', 'Jack', 'Hannah', 'Julian', 'Lily', 'Aaron', 'Addison', 'Eli', 'Eleanor', 'Landon',
    'Natalie', 'David', 'Luna', 'Jonathan', 'Savannah', 'Matthew', 'Leah', 'Adam', 'Zoe', 'Samuel',
    'Stella', 'Joseph', 'Hazel', 'John', 'Ellie', 'Carter', 'Paisley', 'Nicholas', 'Audrey', 'Isaiah',
    'Skylar', 'Charles', 'Violet', 'Thomas', 'Claire', 'Christopher', 'Bella', 'Daniel', 'Aurora', 'Matthew',
    'Lucy', 'Anthony', 'Anna', 'Mark', 'Caroline', 'Donald', 'Genesis', 'Steven', 'Aaliyah', 'Paul',
    'Kennedy', 'Andrew', 'Kinsley', 'Joshua', 'Allison', 'Kenneth', 'Maya', 'Kevin', 'Sarah', 'Brian',
    'Madelyn', 'George', 'Adeline', 'Timothy', 'Alexa', 'Ronald', 'Ariana', 'Jason', 'Elena', 'Edward',
    'Molly', 'Jeffrey', 'Maria', 'Ryan', 'Lydia', 'Jacob', 'Arianna', 'Gary', 'Melody', 'Nicholas',
    'Julia', 'Eric', 'Athena', 'Jonathan', 'Ximena', 'Stephen', 'Arya', 'Larry', 'Ivy', 'Justin',
    'Trinity', 'Scott', 'Josephine', 'Brandon', 'Vivian', 'Benjamin', 'Claire', 'Samuel', 'Sadie', 'Gregory',
    'Delilah', 'Alexander', 'Hadley', 'Patrick', 'Piper', 'Jack', 'Mckenzie', 'Dennis', 'Peyton', 'Jerry',
    'Mackenzie', 'Tyler', 'Reagan', 'Aaron', 'Adalynn', 'Jose', 'Liliana', 'Henry', 'Aubree', 'Adam',
    'Jade', 'Douglas', 'Brooklyn', 'Nathan', 'Destiny', 'Peter', 'Savannah', 'Zachary', 'Vivian', 'Kyle',
    'Rylee', 'Noah', 'Michelle', 'Alan', 'Jocelyn', 'Ethan', 'Thea', 'Jeremy', 'Angela', 'Albert',
    'Emery', 'Willie', 'Melanie', 'Elijah', 'Margaret', 'Wayne', 'Daniela', 'Randy', 'Harmony', 'Roy',
    'Lilly', 'Eugene', 'Paige', 'Louis', 'Adalyn', 'Philip', 'Noelle', 'Bobby', 'Rosalie', 'Johnny',
    'Mary', 'Howard', 'Valentina', 'Eugene', 'Norah', 'Louis', 'Makenna', 'Philip', 'Serenity', 'Bobby'
  ];
  
  const lastNames = [
    'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez',
    'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez',
    'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart',
    'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
    'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
    'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price',
    'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell',
    'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales',
    'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds',
    'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson', 'Ellis',
    'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens', 'Harrison',
    'Fernandez', 'McDonald', 'Woods', 'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman',
    'Webb', 'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon',
    'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks', 'Holmes',
    'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone', 'Salazar', 'Fox', 'Warren',
    'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto',
    'Weaver', 'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins', 'Arnold',
    'Pierce', 'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott', 'Cunningham',
    'Woods', 'Duncan', 'Armstrong', 'Berry', 'Johnston', 'Lane', 'Holland', 'Kennedy', 'Banks', 'Willis',
    'Mack', 'Hoffman', 'Blair', 'Buckley', 'Casey', 'Carpenter', 'Berg', 'Peters', 'Barker', 'Crane',
    'Phelps', 'McGuire', 'Graham', 'Shields', 'Barton', 'Schroeder', 'Maxwell', 'Waters', 'Logan', 'Moody',
    'Figueroa', 'Cordova', 'Wallace', 'Stein', 'Sanchez', 'Bush', 'Thornton', 'Mann', 'Zimmerman', 'Dawson',
    'Lara', 'Fletcher', 'Page', 'Joseph', 'Marquez', 'Reeves', 'Klein', 'Espinoza', 'Baldwin', 'Moran',
    'Love', 'Robbins', 'Higgins', 'Ball', 'Cortez', 'Le', 'Griffith', 'Bowen', 'Sharp', 'Cummings',
    'Ramsey', 'Hardy', 'Swanson', 'Barber', 'Acosta', 'Luna', 'Chandler', 'Daniel', 'Blair', 'Cross',
    'Simon', 'Morse', 'Aguirre', 'Golden', 'Robbins', 'Higgins', 'Ball', 'Cortez', 'Le', 'Griffith'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E'];
  const statuses: ('Active' | 'Inactive' | 'Graduated')[] = ['Active', 'Inactive', 'Graduated'];
  const statusWeights = [0.85, 0.10, 0.05]; // 85% active, 10% inactive, 5% graduated

  // Generate 283 students distributed across grades 1-10
  for (let i = 1; i <= 283; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const grade = Math.floor(Math.random() * 10) + 1; // Grades 1-10
    const section = sections[Math.floor(Math.random() * sections.length)];
    
    // Weighted random status selection
    const random = Math.random();
    let status: 'Active' | 'Inactive' | 'Graduated' = 'Active';
    if (random < statusWeights[0]) status = 'Active';
    else if (random < statusWeights[0] + statusWeights[1]) status = 'Inactive';
    else status = 'Graduated';

    students.push({
      id: i,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      grade: grade.toString(),
      section: section,
      status: status,
      enrollment_date: '2023-09-01',
      avatar_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return students;
};

// Fallback staff data for when database is not set up
const getFallbackStaff = (): Staff[] => {
  const staff: Staff[] = [];
  const firstNames = [
    'John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Jessica',
    'James', 'Ashley', 'Christopher', 'Amanda', 'Daniel', 'Stephanie', 'Matthew', 'Melissa', 'Anthony', 'Nicole'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
  ];

  const roles = [
    'Principal', 'Vice Principal', 'Teacher', 'Math Teacher', 'Science Teacher', 'English Teacher', 
    'History Teacher', 'Art Teacher', 'Physical Education Teacher', 'Music Teacher', 'Librarian',
    'Guidance Counselor', 'Nurse', 'Secretary', 'Maintenance Staff'
  ];

  const departments = ['Administration', 'Academics', 'Support', 'Maintenance'];
  const statuses: ('Active' | 'Inactive' | 'On Leave')[] = ['Active', 'Inactive', 'On Leave'];
  const statusWeights = [0.90, 0.05, 0.05]; // 90% active, 5% inactive, 5% on leave

  // Generate 15 staff members
  for (let i = 1; i <= 15; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    
    // Weighted random status selection
    const random = Math.random();
    let status: 'Active' | 'Inactive' | 'On Leave' = 'Active';
    if (random < statusWeights[0]) status = 'Active';
    else if (random < statusWeights[0] + statusWeights[1]) status = 'Inactive';
    else status = 'On Leave';

    staff.push({
      id: i,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      role: role,
      department: department,
      phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
      hire_date: '2020-08-15',
      status: status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    });
  }

  return staff;
};

// Fallback users data for when database is not set up
const getFallbackUsers = (): User[] => {
  return [
    {
      id: '1',
      email: 'john.smith@jollychildren.edu',
      name: 'John Smith',
      role: 'Admin',
      avatar_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'sarah.johnson@jollychildren.edu',
      name: 'Sarah Johnson',
      role: 'Teacher',
      avatar_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'michael.brown@jollychildren.edu',
      name: 'Michael Brown',
      role: 'Staff',
      avatar_url: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
};

// Students Service
export const studentsService = {
  async getAll(): Promise<Student[]> {
    try {
      const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Database not set up yet, using fallback data:', error.message);
        return getFallbackStudents();
      }
      return data || [];
    } catch (error) {
      console.warn('Database connection failed, using fallback data:', error);
      return getFallbackStudents();
    }
  },

  async getById(id: number): Promise<Student | null> {
    const { data, error } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(student: StudentInsert): Promise<Student> {
    // Try inserting with all fields; if schema doesn't support a field like `suffix`, retry without it
    const attempt = async (payload: any) => supabaseClient
      .from('students')
      .insert(payload)
      .select()
      .single();
    let { data, error } = await attempt(student);
    if (error && /(suffix|full_name|normalized_full_name)/i.test(String(error.message || ''))) {
      const { suffix, full_name, normalized_full_name, ...rest } = student as any;
      const retry = await attempt(rest);
      if (retry.error) throw retry.error;
      return retry.data as Student;
    }
    if (error) throw error;
    return data as Student;
  },

  async update(id: number, updates: StudentUpdate): Promise<Student> {
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    const attempt = async (p: any) => supabaseClient
      .from('students')
      .update(p)
      .eq('id', id)
      .select()
      .single();
    let { data, error } = await attempt(payload);
    if (error && /(suffix|full_name|normalized_full_name)/i.test(String(error.message || ''))) {
      const { suffix, full_name, normalized_full_name, ...rest } = payload;
      const retry = await attempt(rest);
      if (retry.error) throw retry.error;
      return retry.data as Student;
    }
    if (error) throw error;
    return data as Student;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabaseClient
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async search(query: string): Promise<Student[]> {
    const { data, error } = await supabaseClient
      .from('students')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Staff Service
export const staffService = {
  async getAll(): Promise<Staff[]> {
    try {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.listStaff) {
      const res = await anyWindow.electronAPI.admin.listStaff();
      if (res?.ok) return res.data as Staff[];
      console.warn('Admin listStaff failed:', res?.error);
    }
    const { data, error } = await supabaseClient
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    
      if (error) {
        console.warn('Database not set up yet, using fallback data:', error.message);
        return getFallbackStaff();
      }
    return data || [];
    } catch (error) {
      console.warn('Database connection failed, using fallback data:', error);
      return getFallbackStaff();
    }
  },

  async getById(id: number): Promise<Staff | null> {
    const { data, error } = await supabaseClient
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(staff: StaffInsert): Promise<Staff> {
    const { data, error } = await supabaseClient
      .from('staff')
      .insert(staff)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, updates: StaffUpdate): Promise<Staff> {
    const { data, error } = await supabaseClient
      .from('staff')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabaseClient
      .from('staff')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Attendance Service
export const attendanceService = {
  async getByStudent(studentId: number): Promise<Attendance[]> {
    const { data, error } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByDate(date: string): Promise<Attendance[]> {
    const { data, error } = await supabaseClient
      .from('attendance')
      .select(`
        *,
        students!inner(first_name, last_name, grade, section)
      `)
      .eq('date', date);
    
    if (error) throw error;
    return data || [];
  },

  async create(attendance: AttendanceInsert): Promise<Attendance> {
    const { data, error } = await supabaseClient
      .from('attendance')
      .insert(attendance)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, updates: AttendanceUpdate): Promise<Attendance> {
    const { data, error } = await supabaseClient
      .from('attendance')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async bulkCreate(attendanceRecords: AttendanceInsert[]): Promise<Attendance[]> {
    // Upsert to avoid duplicate key on (student_id, date)
    // This will insert new records or update existing ones for the same student/date
    const now = new Date().toISOString();
    const payload = attendanceRecords.map(r => ({ ...r, updated_at: now }));
    const { data, error } = await supabaseClient
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,date' })
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Grades Service
export const gradesService = {
  async getAll(): Promise<Grade[]> {
    const { data, error } = await supabaseClient
      .from('grades')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByStudent(studentId: number): Promise<Grade[]> {
    const { data, error } = await supabaseClient
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getBySubject(subject: string): Promise<Grade[]> {
    const { data, error } = await supabaseClient
      .from('grades')
      .select(`
        *,
        students!inner(first_name, last_name, grade, section)
      `)
      .eq('subject', subject);
    
    if (error) throw error;
    return data || [];
  },

  async create(grade: GradeInsert): Promise<Grade> {
    const { data, error } = await supabaseClient
      .from('grades')
      .insert(grade)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, updates: GradeUpdate): Promise<Grade> {
    const { data, error } = await supabaseClient
      .from('grades')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabaseClient
      .from('grades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Billing Service

// Users Service
export const usersService = {
  async getAll(): Promise<User[]> {
    try {
      const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
      if (anyWindow?.electronAPI?.admin?.listUsers) {
        const res = await anyWindow.electronAPI.admin.listUsers();
        if (res?.ok) return res.data as User[];
        console.warn('Admin listUsers failed:', res?.error);
      }
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Database not set up yet, using fallback data:', error.message);
        return getFallbackUsers();
      }
      return data || [];
    } catch (error) {
      console.warn('Database connection failed, using fallback data:', error);
      return getFallbackUsers();
    }
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(user: UserInsert): Promise<User> {
    try {
      // First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: user.email,
        password: user.password || 'defaultPassword123', // You should generate a secure password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: user.name,
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user in authentication system');
      }

      // Then create the profile in our users table
      const userProfile = {
        id: authData.user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      };

      const { data, error } = await supabaseClient
        .from('users')
        .insert(userProfile)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async update(id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabaseClient
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// App Settings Service
export const settingsService = {
  async get(key: string): Promise<any> {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data?.value || null;
  },

  async set(key: string, value: any): Promise<void> {
    const { error } = await supabaseClient
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) throw error;
  },

  async getAll(): Promise<Record<string, any>> {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('key, value');
    
    if (error) throw error;
    
    const settings: Record<string, any> = {};
    data?.forEach(item => {
      settings[item.key] = item.value;
    });
    
    return settings;
  }
};

// --- Classes Service ---
const getFallbackClasses = (teacherId?: string, year: string = '2024-2025'): ClassSchedule[] => {
  const today = new Date();
  const dow = today.getDay();
  const base: ClassSchedule[] = [
    {
      id: 1,
      name: 'Grade 5 - Class 1',
      subject: 'Mathematics',
      teacher_id: teacherId || '2',
      room: 'Room 201',
      day_of_week: dow,
      start_time: '09:00',
      end_time: '10:00',
      academic_year: year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Grade 5 - Class 1',
      subject: 'Science',
      teacher_id: teacherId || '2',
      room: 'Lab 1',
      day_of_week: dow,
      start_time: '10:15',
      end_time: '11:00',
      academic_year: year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  return base;
};

// --- Grade Sections Service ---
export interface GradeSectionRow {
  id: number;
  grade: number;
  section_name: string;
  academic_year: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradeSectionInsert {
  grade: number;
  section_name: string;
  academic_year: string;
  notes?: string | null;
}

export const gradeSectionsService = {
  async list(academicYear: string): Promise<GradeSectionRow[]> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.listGradeSections) {
      const res = await anyWindow.electronAPI.admin.listGradeSections(academicYear);
      if (res?.ok) return res.data as GradeSectionRow[];
      console.warn('Admin listGradeSections failed:', res?.error);
    }
    const { data, error } = await supabaseClient
      .from('grade_sections')
      .select('*')
      .eq('academic_year', academicYear)
      .order('grade', { ascending: true });
    if (error) {
      const msg = String(error.message || error.toString());
      if (msg.includes('relation') && msg.includes('grade_sections')) {
        throw new Error('Database is missing table public.grade_sections. Open Supabase SQL editor and run database/create-grade-sections-table.sql (and database/rls_policies_all.sql). For legacy readers of public.sections, also run database/compat-sections-view.sql.');
      }
      throw error;
    }
    return data || [];
  },
  async add(section: GradeSectionInsert): Promise<GradeSectionRow> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.addGradeSection) {
      const res = await anyWindow.electronAPI.admin.addGradeSection(section);
      if (res?.ok) return res.data as GradeSectionRow;
      console.warn('Admin addGradeSection failed:', res?.error);
    }
    const { data, error } = await supabaseClient
      .from('grade_sections')
      .insert(section)
      .select()
      .single();
    if (error) {
      const msg = String(error.message || error.toString());
      if (msg.includes('relation') && msg.includes('grade_sections')) {
        throw new Error('Cannot add section: table public.grade_sections does not exist. Run database/create-grade-sections-table.sql then reload the app.');
      }
      if (msg.includes('unique') || msg.includes('duplicate key')) {
        throw new Error('A section with the same name already exists for this grade and year.');
      }
      throw error;
    }
    return data as GradeSectionRow;
  },
  async removeByComposite(grade: number, sectionName: string, academicYear: string): Promise<void> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.removeGradeSectionByComposite) {
      const res = await anyWindow.electronAPI.admin.removeGradeSectionByComposite(grade, sectionName, academicYear);
      if (res?.ok) return;
      console.warn('Admin removeGradeSectionByComposite failed:', res?.error);
    }
    const { error } = await supabaseClient
      .from('grade_sections')
      .delete()
      .eq('grade', grade)
      .eq('section_name', sectionName)
      .eq('academic_year', academicYear);
    if (error) {
      const msg = String(error.message || error.toString());
      if (msg.includes('relation') && msg.includes('grade_sections')) {
        throw new Error('Cannot remove: table public.grade_sections does not exist. Apply migrations then retry.');
      }
      throw error;
    }
  },
};

// --- Section Subjects Service ---
export interface SectionSubjectRow {
  id: number;
  section_id: number;
  subject: string;
  teacher_id?: string | null; // users.id (UUID)
  staff_id?: number | null; // staff.id
  schedule?: any | null; // JSON structure { days:number[], start:string, end:string, room?:string }
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SectionSubjectInsert {
  section_id: number;
  subject: string;
  teacher_id?: string | null;
  staff_id?: number | null;
  schedule?: any | null;
  notes?: string | null;
}

export interface SectionSubjectUpdate {
  subject?: string;
  teacher_id?: string | null;
  staff_id?: number | null;
  schedule?: any | null;
  notes?: string | null;
}

export const sectionSubjectsService = {
  async listBySection(sectionId: number): Promise<SectionSubjectRow[]> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.listSectionSubjects) {
      const res = await anyWindow.electronAPI.admin.listSectionSubjects(sectionId);
      if (res?.ok) return res.data as SectionSubjectRow[];
      console.warn('Admin listSectionSubjects failed:', res?.error);
    }
    const { data, error } = await supabaseClient
      .from('section_subjects')
      .select('*')
      .eq('section_id', sectionId)
      .order('subject', { ascending: true });
    if (error) {
      const msg = String(error.message || error.toString());
      if (msg.includes('relation') && msg.includes('section_subjects')) {
        throw new Error('Database is missing table public.section_subjects. Open Supabase SQL editor and run database/create-section-subjects-table.sql (and database/rls_policies_all.sql), then reload.');
      }
      throw error;
    }
    return data || [];
  },
  async create(row: SectionSubjectInsert): Promise<SectionSubjectRow> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.createSectionSubject) {
      const res = await anyWindow.electronAPI.admin.createSectionSubject(row);
      if (res?.ok) return res.data as SectionSubjectRow;
      console.warn('Admin createSectionSubject failed:', res?.error);
    }
    const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
    const sanitize = (p: any) => {
      const out: any = { ...p };
      if ('teacher_id' in out && !isUuid(out.teacher_id)) delete out.teacher_id;
      if ('staff_id' in out) {
        if (out.staff_id === '' || out.staff_id == null) out.staff_id = null;
        else out.staff_id = Number(out.staff_id);
        if (!Number.isFinite(out.staff_id)) out.staff_id = null;
      }
      return out;
    };
    let { data, error } = await supabaseClient
      .from('section_subjects')
      .insert(sanitize(row))
      .select()
      .single();
    if (error && String(error.message || '').includes("staff_id")) {
      // Fallback: server schema not yet updated. Retry without staff_id
      const { staff_id, ...rest } = row as any;
      const retry = await supabaseClient
        .from('section_subjects')
        .insert(sanitize(rest))
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data as SectionSubjectRow;
    }
    if (error) {
      const msg = String(error.message || error.toString());
      if (msg.includes('relation') && msg.includes('section_subjects')) {
        throw new Error('Cannot add subject: table public.section_subjects does not exist. Run database/create-section-subjects-table.sql then reload the app.');
      }
      if (msg.includes('duplicate key') || msg.includes('unique')) {
        throw new Error('This subject is already assigned to the selected section.');
      }
      throw error;
    }
    return data as SectionSubjectRow;
  },
  async update(id: number, updates: SectionSubjectUpdate): Promise<SectionSubjectRow> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.updateSectionSubject) {
      const res = await anyWindow.electronAPI.admin.updateSectionSubject(id, updates);
      if (res?.ok) return res.data as SectionSubjectRow;
      console.warn('Admin updateSectionSubject failed:', res?.error);
    }
    const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
    const sanitize = (p: any) => {
      const out: any = { ...p };
      if ('teacher_id' in out && !isUuid(out.teacher_id)) delete out.teacher_id;
      if ('staff_id' in out) {
        if (out.staff_id === '' || out.staff_id == null) out.staff_id = null;
        else out.staff_id = Number(out.staff_id);
        if (!Number.isFinite(out.staff_id)) out.staff_id = null;
      }
      return out;
    };
    let { data, error } = await supabaseClient
      .from('section_subjects')
      .update({ ...sanitize(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error && String(error.message || '').includes("staff_id")) {
      // Fallback: remove staff_id from payload if column doesn't exist yet
      const { staff_id, ...rest } = updates as any;
      const retry = await supabaseClient
        .from('section_subjects')
        .update({ ...sanitize(rest), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (retry.error) throw retry.error;
      return retry.data as SectionSubjectRow;
    }
    if (error) {
      const msg = String(error.message || error.toString());
      if (msg.includes('relation') && msg.includes('section_subjects')) {
        throw new Error('Cannot save: table public.section_subjects does not exist. Apply migrations then retry.');
      }
      throw error;
    }
    return data as SectionSubjectRow;
  },
  async remove(id: number): Promise<void> {
    const anyWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (anyWindow?.electronAPI?.admin?.deleteSectionSubject) {
      const res = await anyWindow.electronAPI.admin.deleteSectionSubject(id);
      if (res?.ok) return;
      console.warn('Admin deleteSectionSubject failed:', res?.error);
    }
    const { error } = await supabaseClient
      .from('section_subjects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const classesService = {
  async getTodayForTeacher(teacherId: string, academicYear: string): Promise<ClassSchedule[]> {
    try {
      const today = new Date();
      const dow = today.getDay();
      const { data, error } = await supabaseClient
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('academic_year', academicYear)
        .eq('day_of_week', dow)
        .order('start_time', { ascending: true });
      if (error) {
        console.warn('Classes table not available, using fallback:', error.message);
        return getFallbackClasses(teacherId, academicYear);
      }
      return data || [];
    } catch (e) {
      console.warn('Classes fetch failed, using fallback:', e);
      return getFallbackClasses(teacherId, academicYear);
    }
  },
};
