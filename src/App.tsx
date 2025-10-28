import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Alert, Snackbar } from '@mui/material';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import FinishSignup from './pages/Auth/FinishSignup';
import Dashboard from './pages/Dashboard/Dashboard';
import TeacherDashboard from './pages/Dashboard/TeacherDashboard';
import AccessDenied from './pages/AccessDenied/AccessDenied';
import Students from './pages/Students/Students';
import StudentProfile from './pages/Students/StudentProfile';
import Enrollment from './pages/Enrollment/Enrollment';
import Attendance from './pages/Attendance/Attendance';
import Grading from './pages/Grading/Grading';
import Staff from './pages/Staff/Staff';
import Settings from './pages/Settings/Settings';
import SectionsManager from './pages/Admin/SectionsManager';
import { authService, User } from './services/auth';

// Authentication hook using Supabase
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.signIn(credentials);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return { isAuthenticated, user, login, logout, loading, error, setError };
};

function App() {
  const { isAuthenticated, user, login, logout, loading, error, setError } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box>Loading...</Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Public finish-signup route so invite/recovery redirects don't 404 during onboarding
    const path = window.location.pathname;
    if (path === '/finish-signup' || path === '/auth/finish-signup') {
      return <FinishSignup />;
    }
    return (
      <>
        <Login onLogin={login} />
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Role-aware helpers
  const homePath = user?.role === 'Admin' ? '/dashboard' : '/students';

  const RoleGate: React.FC<{ allow: Array<User['role']>; children: JSX.Element }> = ({ allow, children }) => {
    if (!user || !allow.includes(user.role)) {
      return <Navigate to="/access-denied" replace state={{ from: window.location.pathname }} />;
    }
    return children;
  };

  // At this point, user is non-null because isAuthenticated is true
  const authedUser = user as User;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Layout user={authedUser} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Navigate to={homePath} replace />} />

          {/* Dashboard: Admin vs Staff/Teacher */}
          <Route
            path="/dashboard"
            element={user?.role === 'Admin' ? <Dashboard /> : <TeacherDashboard currentUser={authedUser} />}
          />
          <Route
            path="/enrollment"
            element={
              <RoleGate allow={['Admin']}>
                <Enrollment />
              </RoleGate>
            }
          />
          <Route
            path="/staff"
            element={
              <RoleGate allow={['Admin']}>
                <Staff />
              </RoleGate>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleGate allow={['Admin']}>
                <Settings />
              </RoleGate>
            }
          />
          <Route
            path="/admin/sections"
            element={
              <RoleGate allow={['Admin']}>
                <SectionsManager />
              </RoleGate>
            }
          />

          {/* Shared routes (Admin, Teacher, Staff) */}
          <Route path="/students" element={<Students currentUser={authedUser} />} />
          <Route path="/students/:id" element={<StudentProfile currentUser={authedUser} />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/grading" element={<Grading />} />
          <Route path="/access-denied" element={<AccessDenied />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;
