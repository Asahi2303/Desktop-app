import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Avatar, Chip, Paper, Divider, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { People, Group, School, CheckCircle, Settings, Grade, PersonAddAlt1, AdminPanelSettings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAcademicYear } from '../../lib/AcademicYearContext';
import { studentsService, staffService, attendanceService, gradeSectionsService, Student } from '../../services/database';

const themeGradient = 'linear-gradient(135deg, #2E7D32 0%, #1565C0 100%)';
const qlStyle = { p: 2, display: 'flex', alignItems: 'center', gap: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 } } as const;
const qlIcon = { fontSize: 28, color: 'primary.main' } as const;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { year } = useAcademicYear();

  const [studentCount, setStudentCount] = useState<number>(0);
  const [activeStudentCount, setActiveStudentCount] = useState<number>(0);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [sectionsCount, setSectionsCount] = useState<number>(0);
  const [attendanceToday, setAttendanceToday] = useState<string>('—');
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const students = await studentsService.getAll();
        setStudentCount(students.length);
        const active = students.filter(s => s.status === 'Active');
        setActiveStudentCount(active.length);

        const sorted = [...students].sort((a, b) => {
          const ad = new Date(a.created_at || a.enrollment_date || 0).getTime();
          const bd = new Date(b.created_at || b.enrollment_date || 0).getTime();
          return bd - ad;
        });
        setRecentStudents(sorted.slice(0, 5));
      } catch {
        setStudentCount(0);
        setActiveStudentCount(0);
        setRecentStudents([]);
      }

      try {
        const staff = await staffService.getAll();
        setStaffCount(staff.filter(s => s.status === 'Active').length);
      } catch {
        setStaffCount(0);
      }

      try {
        const secs = await gradeSectionsService.list(year);
        setSectionsCount(secs.length);
      } catch {
        setSectionsCount(0);
      }

      try {
        const today = new Date().toISOString().slice(0, 10);
        const attendance = await attendanceService.getByDate(today);
        const total = attendance.length || studentCount || 0;
        const present = attendance.filter(a => a.status === 'Present').length;
        setAttendanceToday(total > 0 ? `${Math.round((present / total) * 100)}%` : '—');
      } catch {
        setAttendanceToday('—');
      }
    };
    load();
  }, [year]);

  const KPI: React.FC<{ label: string; value: string | number; icon: JSX.Element; color?: string; onClick?: () => void }> = ({ label, value, icon, color = 'primary', onClick }) => (
    <Card onClick={onClick} sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default', '&:hover': { boxShadow: onClick ? 6 : undefined } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{String(value)}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Card sx={{ mb: 3, background: themeGradient, color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>Admin Control Center</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Academic Year: {year}</Typography>
            </Box>
            <Button variant="contained" startIcon={<Settings />} onClick={() => navigate('/settings')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              Settings
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPI label="Students (Active)" value={activeStudentCount} icon={<People />} color="primary" onClick={() => navigate('/students')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI label="Total Students" value={studentCount} icon={<PersonAddAlt1 />} color="secondary" onClick={() => navigate('/students')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI label="Active Staff" value={staffCount} icon={<Group />} color="success" onClick={() => navigate('/staff')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI label="Sections (AY)" value={sectionsCount} icon={<School />} color="warning" onClick={() => navigate('/admin/sections')} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Quick links</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/students')} sx={qlStyle}>
                <People sx={qlIcon} />
                <Typography variant="subtitle1">Students</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/enrollment')} sx={qlStyle}>
                <AdminPanelSettings sx={qlIcon} />
                <Typography variant="subtitle1">Enrollment</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/attendance')} sx={qlStyle}>
                <CheckCircle sx={qlIcon} />
                <Typography variant="subtitle1">Attendance</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/grading')} sx={qlStyle}>
                <Grade sx={qlIcon} />
                <Typography variant="subtitle1">Grading</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/staff')} sx={qlStyle}>
                <Group sx={qlIcon} />
                <Typography variant="subtitle1">Staff</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/admin/sections')} sx={qlStyle}>
                <School sx={qlIcon} />
                <Typography variant="subtitle1">Sections</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper role="button" tabIndex={0} onClick={() => navigate('/settings')} sx={qlStyle}>
                <Settings sx={qlIcon} />
                <Typography variant="subtitle1">Settings</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent students</Typography>
              <List>
                {recentStudents.map(s => (
                  <ListItem key={s.id} divider button onClick={() => navigate(`/students/${s.id}`)}>
                    <ListItemAvatar>
                      <Avatar>{s.first_name?.[0] || 'S'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={`${s.first_name} ${s.last_name}`} secondary={`Grade ${s.grade}${s.section ? ` • ${s.section}` : ''}`} />
                  </ListItem>
                ))}
                {recentStudents.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No recent students.</Typography>
                )}
              </List>
              <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/students')}>View all students</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Today</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Attendance: ${attendanceToday}`} color="success" variant="outlined" />
                <Chip label={`AY: ${year}`} variant="outlined" />
                <Chip label={`Sections: ${sectionsCount}`} variant="outlined" />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">Use the quick links to manage students, enrollment, attendance, grading, staff, and sections.</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
