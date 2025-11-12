import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Person,
  Phone,
  Email,
  LockReset,
  Key,
} from '@mui/icons-material';
import { createStaffUser, generateRecoveryLink, setUserPassword, createOrUpdateUserWithPassword } from '../../services/admin';
import { supabaseClient } from '../../lib/supabase';
import { staffService, Staff as StaffType, StaffInsert, StaffUpdate } from '../../services/database';
 

// Transform the database staff to match component interface
interface StaffDisplay extends StaffType {
  firstName: string;
  lastName: string;
  position: string;
  hireDate: string;
}

const Staff: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffDisplay | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Removed invite/recovery link dialogs to simplify flow
  const [setPwDialogOpen, setSetPwDialogOpen] = useState(false);
  const [setPwValue, setSetPwValue] = useState('');
  const [setPwEmail, setSetPwEmail] = useState('');
  const [form, setForm] = useState<Omit<StaffType, 'id' | 'created_at' | 'updated_at'>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'Active',
    hire_date: '',
    avatar_url: undefined,
  });
  const [sendInvite, setSendInvite] = useState(false);
  const [appRole, setAppRole] = useState<'Admin' | 'Teacher' | 'Staff'>('Staff');

  // Load staff from database
  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAll();
      // Transform data to match component interface
      const transformedStaff: StaffDisplay[] = data.map(staff => ({
        ...staff,
        firstName: staff.first_name,
        lastName: staff.last_name,
        position: staff.role,
        hireDate: staff.hire_date,
      }));
      setStaffMembers(transformedStaff);
    } catch (error: any) {
      setError(error.message || 'Failed to load staff');
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const departments = ['All', 'Administration', 'Academics', 'Support', 'Maintenance'];

  const filteredStaff = staffMembers.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'All' || member.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'On Leave': return 'warning';
      default: return 'default';
    }
  };

  const getStaffStats = () => {
    const total = staffMembers.length;
    const active = staffMembers.filter(s => s.status === 'Active').length;
    const onLeave = staffMembers.filter(s => s.status === 'On Leave').length;
    const byDepartment = staffMembers.reduce((acc, member) => {
      acc[member.department] = (acc[member.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, onLeave, byDepartment };
  };

  const stats = getStaffStats();

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      status: 'Active',
      hire_date: '',
      avatar_url: undefined,
    });
    setStaffDialogOpen(true);
    setSendInvite(true);
    setAppRole('Staff');
  };

  const handleEditStaff = (staff: StaffDisplay) => {
    setSelectedStaff(staff);
    setForm({
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      department: staff.department,
      status: staff.status,
      hire_date: staff.hire_date,
      avatar_url: staff.avatar_url,
    });
    setStaffDialogOpen(true);
  };

  const handleViewStaff = (staff: StaffDisplay) => {
    // In a real app, this would open a detailed view
    console.log('View staff:', staff);
  };

  const handleDeleteStaff = async (staff: StaffDisplay) => {
    if (window.confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}?`)) {
      try {
        await staffService.delete(staff.id);
        await loadStaff(); // Refresh the list
        setError(null);
      } catch (error: any) {
        setError(error.message || 'Failed to delete staff member');
      }
    }
  };

  // Invite flow removed in favor of direct credential management

  const handleSaveStaff = async () => {
    try {
      if (selectedStaff) {
        // update existing
        const updateData: StaffUpdate = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          department: form.department,
          status: form.status,
          hire_date: form.hire_date,
          avatar_url: form.avatar_url,
        };
        await staffService.update(selectedStaff.id, updateData);
      } else {
        // create new
        const newStaff: StaffInsert = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          department: form.department,
          status: form.status,
          hire_date: form.hire_date,
          avatar_url: form.avatar_url,
        };
        await staffService.create(newStaff);

        // Invite email flow removed; credentials can be set via Set Password (Admin)
      }
      await loadStaff(); // Refresh the list
      setStaffDialogOpen(false);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to save staff member');
    }
  };

  const handleFormChange = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Invite link flow removed

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Staff Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddStaff}
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Staff Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2">Total Staff</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
              <Typography variant="body2">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {stats.onLeave}
              </Typography>
              <Typography variant="body2">On Leave</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {Object.keys(stats.byDepartment).length}
              </Typography>
              <Typography variant="body2">Departments</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  label="Department"
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" fullWidth>
                  Export
                </Button>
                <Button variant="outlined" fullWidth>
                  Print
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Staff Members ({filteredStaff.length})
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {member.first_name[0]}{member.last_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {member.first_name} {member.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {member.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Email sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{member.email}</Typography>
                        </Box>
                        {member.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone sx={{ fontSize: 16 }} />
                            <Typography variant="caption">{member.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        color={getStatusColor(member.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(member.hire_date).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewStaff(member)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {/* Resend Invite removed */}
                      {/* Optional: Reset Password Link (hosted form). Commented out to simplify.
                      <Tooltip title="Reset Password Link (Hosted Form)">
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              const link = await generateRecoveryLink({ email: member.email, redirectTo: null });
                              // Copy to clipboard
                              await navigator.clipboard.writeText(link);
                              setSuccess('Reset link copied to clipboard');
                            } catch (e: any) {
                              setError(e?.message || 'Failed to generate recovery link');
                            }
                          }}
                        >
                          <LockReset />
                        </IconButton>
                      </Tooltip>*/}
                      <Tooltip title="Set Password (Admin)">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSetPwEmail(member.email);
                            setSetPwValue('');
                            setSetPwDialogOpen(true);
                          }}
                        >
                          <Key />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Staff">
                        <IconButton
                          size="small"
                          onClick={() => handleEditStaff(member)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Staff">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStaff(member)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={staffDialogOpen} onClose={() => setStaffDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={form.first_name}
                onChange={(e) => handleFormChange('first_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={form.last_name}
                onChange={(e) => handleFormChange('last_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position/Role"
                value={form.role}
                onChange={(e) => handleFormChange('role', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  label="Department"
                  value={form.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                >
                  <MenuItem value="Administration">Administration</MenuItem>
                  <MenuItem value="Academics">Academics</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                value={form.hire_date}
                onChange={(e) => handleFormChange('hire_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                placeholder="Additional notes about the staff member..."
              />
            </Grid>
            {/* Removed invite/reset link buttons for a simpler credentials flow */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>App Role</InputLabel>
                <Select
                  label="App Role"
                  value={appRole}
                  onChange={(e) => setAppRole(e.target.value as any)}
                >
                  <MenuItem value="Staff">Staff</MenuItem>
                  <MenuItem value="Teacher">Teacher</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      id="send-invite"
                      checked={sendInvite}
                      onChange={(e) => setSendInvite(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <label htmlFor="send-invite">Send app invite to this email</label>
                  </Box>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Person />}
            onClick={handleSaveStaff}
          >
            {selectedStaff ? 'Update' : 'Add'} Staff Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      {/* Invite/Reset link dialog removed for simplified flow */}
      {/* Admin Set Password Dialog */}
      <Dialog open={setPwDialogOpen} onClose={() => setSetPwDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Password (Admin)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Set a new password for: <strong>{setPwEmail}</strong>
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={setPwValue}
            onChange={(e) => setSetPwValue(e.target.value)}
            helperText="This will set the password immediately (works in desktop and web)."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetPwDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (!setPwEmail || !setPwValue) {
                  setError('Email and password are required');
                  return;
                }
                // Universal: uses Electron admin bridge if available; otherwise invokes Edge Function
                await createOrUpdateUserWithPassword({ email: setPwEmail, password: setPwValue });
                setSuccess('Password updated. The user can log in now.');
                setSetPwDialogOpen(false);
                setSetPwValue('');
              } catch (e: any) {
                setError(e?.message || 'Failed to set credentials');
              }
            }}
          >
            Save Password
          </Button>
        </DialogActions>
      </Dialog>
      {/* Success Notification */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Staff;
