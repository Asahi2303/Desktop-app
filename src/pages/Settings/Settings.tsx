import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, TextField, Avatar, Snackbar, Alert, Divider } from '@mui/material';
import { Save } from '@mui/icons-material';
import { authService, User as AuthUser } from '../../services/auth';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AuthUser['role']>('Admin');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const u = await authService.getCurrentUser();
        if (!u) {
          setError('No authenticated user.');
          return;
        }
        setUser(u);
        setName(u.name || '');
        setEmail(u.email);
        setRole(u.role);
        setAvatarUrl(u.avatar || '');
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const initials = useMemo(() => {
    if (name?.trim()) {
      const parts = name.trim().split(/\s+/);
      return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    }
    if (email) return email[0]?.toUpperCase() || 'A';
    return 'A';
  }, [name, email]);

  const handleSaveProfile = async () => {
    try {
      setError(null);
      setSuccess(null);
      const updated = await authService.updateProfile({ name, avatar: avatarUrl });
      setUser(updated);
      setSuccess('Profile updated');
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      setError(null);
      setSuccess(null);
      if (!newPassword.trim()) {
        setError('New password is required');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      await authService.changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated');
    } catch (e: any) {
      setError(e.message || 'Failed to update password');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and update your account details.
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar src={avatarUrl || undefined} sx={{ width: 96, height: 96, fontSize: 32 }}>
                {initials}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={email}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={role}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Avatar URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSaveProfile} disabled={loading}>
                  Save Profile
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
              Update Password
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
