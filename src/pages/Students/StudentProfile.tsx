import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Tabs,
  Tab,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  School,
  CheckCircle,
  Grade,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsService, gradesService, attendanceService, Student, Grade as GradeRecord, Attendance as AttendanceRecord } from '../../services/database';
import type { User } from '../../services/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Transform the database student to match component interface
interface StudentDisplay extends Student {
  firstName: string;
  lastName: string;
  enrollmentDate: string;
}

interface StudentProfileProps { currentUser?: User }

const StudentProfile: React.FC<StudentProfileProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [student, setStudent] = useState<StudentDisplay | null>(null);
  const [studentGrades, setStudentGrades] = useState<{
    subject: string;
    assignment: string;
    percentage: number;
    descriptor: string;
    term: string;
    date: string;
  }[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const studentData = await studentsService.getById(Number(id));
        
        if (studentData) {
          // Transform data to match component interface
          const transformedStudent: StudentDisplay = {
            ...studentData,
            firstName: studentData.first_name,
            lastName: studentData.last_name,
            enrollmentDate: studentData.enrollment_date,
          };
          setStudent(transformedStudent);
        } else {
          setStudent(null);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load student');
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  useEffect(() => {
    const loadStudentGrades = async () => {
      if (!id) return;
      
      try {
        const rawGrades = await gradesService.getByStudent(Number(id));
        const describePerformance = (pct: number): string => {
          if (pct >= 90) return 'Outstanding';
          if (pct >= 85) return 'Very Satisfactory';
          if (pct >= 80) return 'Satisfactory';
          if (pct >= 75) return 'Fairly Satisfactory';
          return 'Did Not Meet Expectations';
        };
        const mapped = rawGrades.map((g: GradeRecord) => ({
          subject: g.subject,
          assignment: g.notes || '—',
          percentage: Number(g.grade) || 0,
          descriptor: describePerformance(Number(g.grade) || 0),
          term: g.academic_year || '—',
          date: g.created_at,
        }));
        // Most recent first
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setStudentGrades(mapped);
      } catch (error) {
        console.error('Error loading student grades:', error);
        setStudentGrades([]);
      }
    };

    loadStudentGrades();
  }, [id]);

  useEffect(() => {
    const loadStudentAttendance = async () => {
      if (!id) return;
      try {
        const records = await attendanceService.getByStudent(Number(id));
        // Sort recent first
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setStudentAttendance(records);
      } catch (error) {
        console.error('Error loading attendance:', error);
        setStudentAttendance([]);
      }
    };
    loadStudentAttendance();
  }, [id]);

  const initials = useMemo(() => {
    if (!student) return '??';
    const f = student.firstName?.[0] || '?';
    const l = student.lastName?.[0] || '?';
    return `${f}${l}`;
  }, [student]);

  // Removed hardcoded attendance/grades/payments; data now comes from DB

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      default: return 'default';
    }
  };
  const getDescriptorColor = (desc: string) => {
    switch (desc) {
      case 'Outstanding': return 'success';
      case 'Very Satisfactory': return 'info';
      case 'Satisfactory': return 'primary';
      case 'Fairly Satisfactory': return 'warning';
      default: return 'error';
    }
  };

  if (loading) {
    return (
      <Box>
        <Button variant="outlined" onClick={() => navigate('/students')}>
          ← Back to Students
        </Button>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading student information...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button variant="outlined" onClick={() => navigate('/students')}>
          ← Back to Students
        </Button>
        <Typography variant="h6" sx={{ mt: 2 }} color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box>
        <Button variant="outlined" onClick={() => navigate('/students')}>
          ← Back to Students
        </Button>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Student not found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/students')}
        >
          ← Back to Students
        </Button>
        {/* Edit Student button removed as requested */}
      </Box>

      {/* Student Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80, fontSize: 32 }}>
                {initials}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {student.firstName} {student.lastName}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                <Chip label={`LRN: ${student.lrn || '-'}`} variant="outlined" />
                <Chip label={`Grade ${student.grade || '-'}`} color="primary" />
                <Chip label={`Section ${student.section || '-'}`} color="secondary" />
                <Chip
                  label={student.status}
                  color={student.status === 'Active' ? 'success' : 'warning'}
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">{student.email}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<School />} label="Details" />
            <Tab icon={<CheckCircle />} label="Attendance" />
            <Tab icon={<Grade />} label="Grades" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="LRN"
                    secondary={student.lrn || '—'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Grade"
                    secondary={`Grade ${student.grade || '-'}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Section"
                    secondary={`Section ${student.section || '-'}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={student.status}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={student.email || '—'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Enrollment Date"
                    secondary={new Date(student.enrollmentDate).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Recent Attendance</Typography>
          <List>
            {studentAttendance.slice(0, 20).map((record, index) => (
              <ListItem key={record.id || index} divider>
                <ListItemIcon>
                  <CheckCircle color={getStatusColor(record.status) as any} />
                </ListItemIcon>
                <ListItemText
                  primary={new Date(record.date).toLocaleDateString()}
                  secondary={record.notes || ''}
                />
                <Chip
                  label={record.status}
                  size="small"
                  color={getStatusColor(record.status) as any}
                />
              </ListItem>
            ))}
            {studentAttendance.length === 0 && (
              <Typography variant="body2" color="text.secondary">No attendance records.</Typography>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Academic Performance</Typography>
          <List>
            {studentGrades.map((record, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`${record.subject} • ${record.assignment || '—'}`}
                  secondary={`${record.term || '—'} - ${record.percentage}%`}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={record.descriptor}
                    size="small"
                    color={getDescriptorColor(record.descriptor) as any}
                  />
                  <Chip
                    label={`${record.percentage}%`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </ListItem>
            ))}
            {studentGrades.length === 0 && (
              <Typography variant="body2" color="text.secondary">No grades yet.</Typography>
            )}
          </List>
        </TabPanel>
        {/* Payments tab removed as requested */}
      </Card>
    </Box>
  );
};

export default StudentProfile;
