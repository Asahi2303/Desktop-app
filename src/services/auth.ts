import { supabaseClient } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'Admin' | 'Teacher' | 'Staff';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// User profile interface for database
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'Admin' | 'Teacher' | 'Staff';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Fallback authentication for when database is not set up
const getFallbackAuth = (credentials: LoginCredentials): User => {
  if (credentials.email === 'admin@jollychildren.edu' && credentials.password === 'admin123') {
    return {
      id: '1',
      email: credentials.email,
      name: 'Administrator',
      role: 'Admin',
      avatar: undefined,
    };
  } else if (credentials.email === 'teacher@jollychildren.edu' && credentials.password === 'teacher123') {
    return {
      id: '2',
      email: credentials.email,
      name: 'John Teacher',
      role: 'Teacher',
      avatar: undefined,
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

const ALLOWED_ROLES = ['Admin', 'Teacher', 'Staff'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function ensureAllowedRole(role: string | undefined): asserts role is AllowedRole {
  if (!role || !ALLOWED_ROLES.includes(role as AllowedRole)) {
    throw new Error('Access denied: This application is only for Admins and Staff/Teachers.');
  }
}

export const authService = {
  async signIn(credentials: LoginCredentials): Promise<User> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const authPromise = supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (error) {
        // Fallback to mock authentication if database is not set up
        console.warn('Database authentication failed, using fallback:', error.message);
        return getFallbackAuth(credentials);
      }
      if (!data.user) throw new Error('No user data returned');

      // Get user profile from our custom users table
      const { data: profile, error: profileError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        // If no profile exists, create a default one
        const defaultProfile = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          role: 'Teacher' as const,
          avatar_url: data.user.user_metadata?.avatar_url,
        };

        const { error: insertError } = await supabaseClient
          .from('users')
          .insert(defaultProfile);

        if (insertError) throw insertError;

        // Enforce role restrictions
        ensureAllowedRole(defaultProfile.role);

        return {
          id: defaultProfile.id,
          email: defaultProfile.email,
          name: defaultProfile.name,
          role: defaultProfile.role,
          avatar: defaultProfile.avatar_url,
        };
      }

      // Enforce role restrictions
      ensureAllowedRole((profile as any)?.role);

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar_url,
      };
    } catch (error) {
      console.warn('Database connection failed, using fallback authentication:', error);
      return getFallbackAuth(credentials);
    }
  },

  async changePassword(newPassword: string): Promise<void> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const authPromise = supabaseClient.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (!user) return null;

      const { data: profile, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) return null;

      // Enforce role restrictions
      ensureAllowedRole((profile as any)?.role);

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar_url,
      };
    } catch (error) {
      console.warn('Database connection failed for getCurrentUser:', error);
      return null;
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabaseClient
      .from('users')
      .update({
        name: updates.name,
        avatar_url: updates.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar_url,
    };
  },

  // For demo purposes - create a demo user
  async createDemoUser(): Promise<void> {
    const demoUsers = [
      {
        email: 'admin@jollychildren.edu',
        password: 'admin123',
        name: 'Administrator',
        role: 'Admin' as const,
      },
      {
        email: 'teacher@jollychildren.edu',
        password: 'teacher123',
        name: 'John Teacher',
        role: 'Teacher' as const,
      },
    ];

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseClient.auth.getUser();
        
        // Sign up the user
        const { data, error } = await supabaseClient.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
            },
          },
        });

        if (error && !error.message.includes('already registered')) {
          console.error('Error creating demo user:', error);
        } else if (data.user) {
          // Create profile in users table
          await supabaseClient
            .from('users')
            .insert({
              id: data.user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            });
        }
      } catch (error) {
        console.error('Error setting up demo user:', error);
      }
    }
  }
};
