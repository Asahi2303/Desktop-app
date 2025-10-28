import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Save,
  Print,
  FilterList,
  Refresh,
  History,
  Person,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { studentsService, attendanceService, Attendance as AttendanceType, AttendanceInsert } from '../../services/database';
import { getSectionsForGrade } from '../../lib/gradeSections';

interface StudentAttendance {
  id: number;
  student_id: number;
  name: string;
  rollNumber: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  date: string;
  notes?: string;
}

interface AdminActivity {
  id: string;
  timestamp: Date;
  adminName: string;
  action: string;
  studentName: string;
  previousStatus?: string;
  newStatus: string;
  details: string;
}

const Attendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [adminActivityLog, setAdminActivityLog] = useState<AdminActivity[]>([]);
  const [adminName] = useState('Admin User'); // In a real app, this would come from auth context

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  // --- Semi-persistent Admin Activity Log helpers ---
  const getLogStorageKey = (date: Date, grade: string, section: string) => {
    const dateStr = date.toISOString().slice(0, 10);
    return `attendanceLog:${dateStr}:${grade}:${section}`;
  };

  const serializeLog = (log: AdminActivity[]) =>
    log.map((item) => ({ ...item, timestamp: item.timestamp.toISOString() }));

  const deserializeLog = (raw: any[]): AdminActivity[] =>
    (raw || []).map((item) => ({ ...item, timestamp: new Date(item.timestamp) }));

  const loadActivityLog = () => {
    if (!selectedGrade || !selectedSection) {
      setAdminActivityLog([]);
      return;
    }
    try {
      const key = getLogStorageKey(selectedDate, selectedGrade, selectedSection);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAdminActivityLog(deserializeLog(parsed));
      } else {
        setAdminActivityLog([]);
      }
    } catch {
      setAdminActivityLog([]);
    }
  };

  const saveActivityLog = (nextLog: AdminActivity[]) => {
    if (!selectedGrade || !selectedSection) return;
    try {
      const key = getLogStorageKey(selectedDate, selectedGrade, selectedSection);
      localStorage.setItem(key, JSON.stringify(serializeLog(nextLog)));
    } catch {
      // ignore storage errors
    }
  };

  // Reload log whenever the selection changes
  useEffect(() => {
    loadActivityLog();
  }, [selectedDate, selectedGrade, selectedSection]);

  // Load students and attendance data
  const loadAttendanceData = async () => {
    if (!selectedGrade || !selectedSection) {
      setAttendanceData([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get all students
      const allStudents = await studentsService.getAll();
      
      // Filter students by grade and section
      const filteredStudents = allStudents.filter(student => 
        student.grade === selectedGrade && student.section === selectedSection
      );
      
      // Get existing attendance for the selected date
      const dateStr = selectedDate.toISOString().slice(0, 10);
      const existingAttendance = await attendanceService.getByDate(dateStr);
      
      // Create attendance records for students
      const attendanceRecords: StudentAttendance[] = filteredStudents.map(student => {
        const existing = existingAttendance.find(att => att.student_id === student.id);
        return {
          id: existing?.id || 0,
          student_id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          rollNumber: student.id.toString().padStart(3, '0'),
          status: existing?.status || 'Present',
          date: dateStr,
          notes: existing?.notes,
        };
      });
      
      setAttendanceData(attendanceRecords);
    } catch (error: any) {
      setError(error.message || 'Failed to load attendance data');
      console.error('Error loading attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, selectedGrade, selectedSection]);

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedSection('');
    setAttendanceData([]);
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    // data will load via effect
  };

  const handleStatusChange = (studentId: number, newStatus: StudentAttendance['status']) => {
    setAttendanceData(prev => {
      const updatedData = prev.map(student => {
        if (student.student_id === studentId) {
          const activity: AdminActivity = {
            id: `${Date.now()}-${studentId}`,
            timestamp: new Date(),
            adminName: adminName,
            action: 'Status Changed',
            studentName: student.name,
            previousStatus: student.status,
            newStatus: newStatus,
            details: `Changed ${student.name}'s attendance from ${student.status} to ${newStatus}`
          };
          setAdminActivityLog(prevLog => {
            const next = [activity, ...prevLog.slice(0, 49)];
            saveActivityLog(next);
            return next;
          });
          return { ...student, status: newStatus };
        }
        return student;
      });
      return updatedData;
    });
  };

  const handleSaveAttendance = () => {
    setSaveDialogOpen(true);
  };

  const confirmSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dateStr = selectedDate.toISOString().slice(0, 10);
      
      // Log bulk save activity
      const saveActivity: AdminActivity = {
        id: `save-${Date.now()}`,
        timestamp: new Date(),
        adminName: adminName,
        action: 'Bulk Save',
        studentName: `${attendanceData.length} students`,
        newStatus: 'Saved',
        details: `Saved attendance for Grade ${selectedGrade} - Section ${selectedSection} on ${selectedDate.toLocaleDateString()}`
      };
      setAdminActivityLog(prevLog => {
        const next = [saveActivity, ...prevLog.slice(0, 49)];
        saveActivityLog(next);
        return next;
      });
      
      // Create attendance records for the database
      const attendanceRecords: AttendanceInsert[] = attendanceData.map(record => ({
        student_id: record.student_id,
        date: dateStr,
        status: record.status,
        notes: record.notes,
      }));
      
      // Save attendance records
      await attendanceService.bulkCreate(attendanceRecords);
      
      setSuccess(true);
      setSaveDialogOpen(false);
      
      // Refresh the data
      await loadAttendanceData();
      
    } catch (error: any) {
      setError(error.message || 'Failed to save attendance');
      console.error('Error saving attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: StudentAttendance['status']) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      case 'Excused': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: StudentAttendance['status']) => {
    switch (status) {
      case 'Present': return <CheckCircle />;
      case 'Absent': return <Cancel />;
      case 'Late': return <Schedule />;
      case 'Excused': return <Schedule />;
      default: return <CheckCircle />;
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(s => s.status === 'Present').length;
    const absent = attendanceData.filter(s => s.status === 'Absent').length;
    const late = attendanceData.filter(s => s.status === 'Late').length;
    const excused = attendanceData.filter(s => s.status === 'Excused').length;
    
    return { total, present, absent, late, excused };
  };

  const stats = getAttendanceStats();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Attendance</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              disabled={!selectedGrade || !selectedSection}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Class
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue || new Date())}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={selectedGrade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    label="Grade"
                  >
                    {grades.map(grade => (
                      <MenuItem key={grade} value={grade}>
                        Grade {grade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={selectedSection}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    label="Section"
                    disabled={!selectedGrade}
                  >
                    {getSectionsForGrade(selectedGrade).length === 0 ? (
                      <MenuItem disabled value="">
                        {selectedGrade ? 'No sections configured for this grade' : 'Select grade first'}
                      </MenuItem>
                    ) : (
                      getSectionsForGrade(selectedGrade).map(section => (
                        <MenuItem key={section} value={section}>
                          {section}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<FilterList />}
                  disabled={!selectedGrade || !selectedSection}
                >
                  Load Class
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        {selectedGrade && selectedSection && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2">Total Students</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.present}
                  </Typography>
                  <Typography variant="body2">Present</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {stats.absent}
                  </Typography>
                  <Typography variant="body2">Absent</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.late}
                  </Typography>
                  <Typography variant="body2">Late</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {stats.excused}
                  </Typography>
                  <Typography variant="body2">Excused</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                  </Typography>
                  <Typography variant="body2">Attendance %</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Admin Activity Log */}
        {adminActivityLog.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Admin Activity Log</Typography>
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {adminActivityLog.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {activity.adminName}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                          • {activity.action}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {activity.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{activity.studentName}</strong>
                      {activity.previousStatus && (
                        <span>
                          {' '}• Changed from <span style={{ color: '#f44336' }}>{activity.previousStatus}</span> to{' '}
                          <span style={{ color: '#4caf50' }}>{activity.newStatus}</span>
                        </span>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.details}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        {selectedGrade && selectedSection && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Grade {selectedGrade} - {selectedSection}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveAttendance}
                  disabled={attendanceData.length === 0}
                >
                  Save Attendance
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll No.</TableCell>
                      <TableCell>Student Name</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="center">Late</TableCell>
                      <TableCell align="center">Excused</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceData.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={student.status === 'Present'}
                            onChange={() => handleStatusChange(student.student_id, 'Present')}
                            color="success"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={student.status === 'Absent'}
                            onChange={() => handleStatusChange(student.student_id, 'Absent')}
                            color="error"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={student.status === 'Late'}
                            onChange={() => handleStatusChange(student.student_id, 'Late')}
                            color="warning"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={student.status === 'Excused'}
                            onChange={() => handleStatusChange(student.student_id, 'Excused')}
                            color="info"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(student.status)}
                            label={student.status}
                            color={getStatusColor(student.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Save Confirmation Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Save Attendance</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to save the attendance for Grade {selectedGrade} - Section {selectedSection} 
              on {selectedDate.toLocaleDateString()}?
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              This action cannot be undone. Please review the attendance data before saving.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmSave} 
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
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

        {/* Success Notification */}
        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
        >
          <Alert onClose={() => setSuccess(false)} severity="success">
            Attendance saved successfully!
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Attendance;
