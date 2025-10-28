import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, List, ListItem, ListItemText, Chip, ListItemSecondaryAction } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAcademicYear } from '../../lib/AcademicYearContext';
import { studentsService, gradesService, attendanceService, Grade, settingsService, classesService, ClassSchedule } from '../../services/database';
import { User } from '../../services/auth';

const TeacherDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { year } = useAcademicYear();

  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<string>('—');
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [announcements, setAnnouncements] = useState<Array<{ title: string; detail: string }>>([]);
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Total students
        const students = await studentsService.getAll();
        setTotalStudents(students.length);

        // Today's attendance rate
        try {
          const todayAttendance = await attendanceService.getByDate(today);
          const total = todayAttendance.length || students.length || 0;
          const present = todayAttendance.filter(a => a.status === 'Present').length;
          if (total > 0) setAttendanceRate(`${Math.round((present / total) * 100)}%`);
          else setAttendanceRate('—');
        } catch {
          setAttendanceRate('—');
        }

        // Recent grades for selected academic year
        try {
          const allGrades = await gradesService.getAll();
          const filtered = allGrades
            .filter(g => g.academic_year === year)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
          setRecentGrades(filtered);
        } catch {
          setRecentGrades([]);
        }

        // Today's classes for this teacher
        try {
          if (currentUser?.id) {
            const classes = await classesService.getTodayForTeacher(currentUser.id, year);
            setTodayClasses(classes);
          }
        } catch {
          setTodayClasses([]);
        }

        // Announcements from settings, then fallback to localStorage
        try {
          const allSettings = await settingsService.getAll();
          const anns = allSettings.announcements || [];
          if (Array.isArray(anns) && anns.length > 0) {
            setAnnouncements(anns);
          } else {
            const cached = localStorage.getItem('settings:announcements');
            setAnnouncements(cached ? JSON.parse(cached) : []);
          }
        } catch {
          try {
            const cached = localStorage.getItem('settings:announcements');
            setAnnouncements(cached ? JSON.parse(cached) : []);
          } catch {
            setAnnouncements([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today, year, currentUser?.id]);

  // announcements state is populated from admin settings; empty means show none

  return (
    <Box>
  <Typography variant="h4" sx={{ mb: 3 }}>Welcome</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Today</Typography>
              <List>
                <ListItem
                  divider
                  sx={{ pr: { xs: 18, sm: 24 } }}
                  secondaryAction={
                    <Box sx={{ minWidth: { xs: 140, sm: 200 }, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button variant="contained" size="small" onClick={() => navigate('/attendance')}>Take Attendance</Button>
                    </Box>
                  }
                >
                  <ListItemText primary={`Attendance (${today})`} secondary={`Rate: ${attendanceRate}`} />
                </ListItem>
                {todayClasses.map((c) => (
                  <ListItem
                    key={c.id}
                    divider
                    sx={{ pr: { xs: 20, sm: 26 } }}
                    secondaryAction={
                      <Box sx={{ minWidth: { xs: 160, sm: 220 }, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" size="small" onClick={() => navigate('/attendance')}>Attendance</Button>
                        <Button variant="outlined" size="small" onClick={() => navigate('/grading')}>Grades</Button>
                      </Box>
                    }
                  >
                    <ListItemText primary={`${c.subject} • ${c.name}`} secondary={`${c.start_time} - ${c.end_time} • ${c.room || 'Room TBD'}`} />
                  </ListItem>
                ))}
                {todayClasses.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No scheduled classes today.</Typography>
                )}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Grade Entry</Typography>
              <List>
                {recentGrades.map((g, idx) => (
                  <ListItem key={idx} divider secondaryAction={<Button variant="outlined" size="small" onClick={() => navigate('/grading')}>Enter Grades</Button>}>
                    <ListItemText primary={`${g.subject} • ${g.grade}/${g.max_grade}`} secondary={`${g.semester} • ${g.academic_year}`} />
                  </ListItem>
                ))}
                {recentGrades.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No grade activity yet for {year}.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>At a Glance</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Students: ${loading ? '…' : totalStudents}`} />
                <Chip label={`Attendance: ${attendanceRate}`} />
                <Chip label={`AY: ${year}`} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Announcements</Typography>
              <List>
                {announcements.map((a, idx) => (
                  <ListItem key={idx} divider>
                    <ListItemText primary={a.title} secondary={a.detail} />
                  </ListItem>
                ))}
                {announcements.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No announcements.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
