import React, { useEffect, useState } from 'react';
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
  TextField,
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
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Grade,
  Add,
  Edit,
  Save,
  Print,
  FilterList,
  Assignment,
  Delete,
} from '@mui/icons-material';
import { studentsService, gradesService, Grade as GradeRecord, GradeInsert, GradeUpdate } from '../../services/database';
// Use ESM-friendly imports for jsPDF + autotable
// We'll also dynamically import inside the print function to avoid plugin attach issues.

// Transform the database grade to match component interface
interface GradeDisplay extends Omit<GradeRecord, 'grade'> {
  studentName: string;
  assignment: string;
  grade: string; // Performance descriptor based on percentage
  percentage: number; // Numeric grade
  date: string;
  term: string;
  studentGrade?: string; // Student's grade level for filtering
}

const Grading: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeDisplay | null>(null);
  const [records, setRecords] = useState<GradeDisplay[]>([]);
  const [students, setStudents] = useState<{ id: number; firstName: string; lastName: string; lrn?: string | null; grade?: string; section?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Print dialog state
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printStudentId, setPrintStudentId] = useState<number | ''>('');
  const [printing, setPrinting] = useState(false);

  // Controlled form state for dialog
  const [formStudentId, setFormStudentId] = useState<number | ''>('');
  const [formSubject, setFormSubject] = useState('');
  const [formAssignment, setFormAssignment] = useState('');
  const [formPercentage, setFormPercentage] = useState<number | ''>('');
  const [formDate, setFormDate] = useState('');
  const [formTerm, setFormTerm] = useState('');
  const [formQuarter, setFormQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | ''>('');

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Art', 'Physical Education'];
  const terms = ['Fall 2023', 'Spring 2024', 'Summer 2024'];
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const quarters: { label: string; value: 'Q1' | 'Q2' | 'Q3' | 'Q4' }[] = [
    { label: '1st Quarter', value: 'Q1' },
    { label: '2nd Quarter', value: 'Q2' },
    { label: '3rd Quarter', value: 'Q3' },
    { label: '4th Quarter', value: 'Q4' },
  ];

  const quarterLabel = (q?: string) => {
    switch (q) {
      case 'Q1': return '1st Quarter';
      case 'Q2': return '2nd Quarter';
      case 'Q3': return '3rd Quarter';
      case 'Q4': return '4th Quarter';
      default: return '';
    }
  };

  // Map numeric percentage to performance descriptor
  const describePerformance = (pct: number): string => {
    if (pct >= 90) return 'Outstanding';
    if (pct >= 85) return 'Very Satisfactory';
    if (pct >= 80) return 'Satisfactory';
    if (pct >= 75) return 'Fairly Satisfactory';
    return 'Did Not Meet Expectations';
  };

  // Load grades and students from database
  const loadGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all grades
      const allGrades = await gradesService.getAll();
      const allStudents = await studentsService.getAll();
      
      // Transform grades to match component interface
      const transformedGrades: GradeDisplay[] = allGrades.map(grade => {
        const student = allStudents.find(s => s.id === grade.student_id);
        const pct = Number(grade.grade) || 0;
        return {
          ...grade,
          studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          assignment: grade.notes || 'Assignment',
          grade: describePerformance(pct),
          percentage: pct,
          date: grade.created_at.split('T')[0],
          term: quarterLabel(grade.semester) || grade.academic_year,
          studentGrade: student?.grade || undefined,
        };
      });
      
      setRecords(transformedGrades);
      
      // Set students for selection
      setStudents(allStudents.map(s => ({ 
        id: s.id, 
        firstName: s.first_name, 
        lastName: s.last_name,
        lrn: s.lrn ?? null,
        grade: s.grade,
        section: s.section,
      })));
      
    } catch (error: any) {
      setError(error.message || 'Failed to load grades');
      console.error('Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const filteredGrades = records.filter(record => {
    const matchesSubject = !selectedSubject || record.subject === selectedSubject;
    const matchesTerm = !selectedTerm || record.term === selectedTerm;
    const matchesGradeLevel = !selectedGrade || (record.studentGrade === selectedGrade);
    return matchesSubject && matchesTerm && matchesGradeLevel;
  });

  const getGradeColor = (desc: string) => {
    switch (desc) {
      case 'Outstanding':
        return 'success';
      case 'Very Satisfactory':
        return 'info';
      case 'Satisfactory':
        return 'primary';
      case 'Fairly Satisfactory':
        return 'warning';
      default:
        return 'error';
    }
  };

  // Generate PDF for selected student
  const handleOpenPrint = () => {
    setPrintStudentId('');
    setPrintDialogOpen(true);
  };

  const handlePrintGrades = async () => {
    if (!printStudentId) return;
    try {
      setPrinting(true);
      const student = students.find(s => s.id === printStudentId);
      if (!student) {
        setError('Selected student not found.');
        return;
      }
      const all = await gradesService.getByStudent(printStudentId as number);
      if (!all || all.length === 0) {
        setInfo('No grades found for the selected student.');
        return;
      }
      // Group by subject
      const bySubject = all.reduce<Record<string, GradeRecord[]>>((acc, g) => {
        const key = g.subject || 'Unknown';
        acc[key] = acc[key] || [];
        acc[key].push(g);
        return acc;
      }, {});
      // Dynamic import to ensure plugin attaches correctly in CRA/Electron hybrid
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const marginX = 48; // 0.67in
      let cursorY = 72; // 1in top

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Student Grade Report', marginX, cursorY);
      cursorY += 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const fullNameLine = `${student.firstName} ${student.lastName}${student.lrn ? `  •  LRN: ${student.lrn}` : ''}`;
      const classLine = `Grade ${student.grade ?? '-'}  •  Section ${student.section ?? '-'}`;
      doc.text(fullNameLine, marginX, cursorY);
      cursorY += 16;
      doc.text(classLine, marginX, cursorY);
      cursorY += 24;

      // For each subject, render a titled table
      const subjects = Object.keys(bySubject).sort();
      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        const rows = bySubject[subject]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map(g => [
            subject,
            g.notes || '—',
            quarterLabel(g.semester) || g.academic_year || '—',
            `${Number(g.grade) || 0}%`,
            describePerformance(Number(g.grade) || 0),
            new Date(g.created_at).toLocaleDateString(),
          ]);

        // Subject title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(subject, marginX, cursorY);
        cursorY += 8;

        autoTable(doc, {
          startY: cursorY + 8,
          margin: { left: marginX, right: marginX },
          head: [['Subject', 'Assignment', 'Quarter', 'Percentage', 'Descriptor', 'Date']],
          body: rows,
          styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: 'left' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          theme: 'grid',
        });
        // Get the final Y from last table
        const lastY = (doc as any).lastAutoTable?.finalY || cursorY + 100;
        cursorY = lastY + 24;

        // Page break if close to bottom
        if (cursorY > doc.internal.pageSize.getHeight() - 96 && i < subjects.length - 1) {
          doc.addPage();
          cursorY = 72;
        }
      }

      const fileName = `Grades_${student.firstName}_${student.lastName}.pdf`;
      doc.save(fileName);
      setPrintDialogOpen(false);
    } catch (e: any) {
      console.error('Print error:', e);
      setError(e?.message || 'Failed to generate PDF');
    } finally {
      setPrinting(false);
    }
  };

  const handleAddGrade = () => {
    setEditingGrade(null);
    setFormStudentId('');
    setFormSubject(selectedSubject || '');
    setFormAssignment('');
    setFormPercentage('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTerm(selectedTerm || '');
    setFormQuarter('');
    setGradeDialogOpen(true);
  };

  const handleEditGrade = (grade: GradeDisplay) => {
    setEditingGrade(grade);
    setFormStudentId(grade.student_id);
    setFormSubject(grade.subject);
    setFormAssignment(grade.assignment);
    setFormPercentage(grade.percentage);
    setFormDate(grade.date);
    // Attempt to reverse-map quarter label to Q1-Q4; fallback empty
    const qMap: Record<string, 'Q1'|'Q2'|'Q3'|'Q4'> = {
      '1st Quarter': 'Q1',
      '2nd Quarter': 'Q2',
      '3rd Quarter': 'Q3',
      '4th Quarter': 'Q4',
    };
    setFormTerm(grade.term);
    setFormQuarter(qMap[grade.term] || '');
    setGradeDialogOpen(true);
  };

  const handlePercentageChange = (value: string) => {
    if (value === '') {
      setFormPercentage('');
      return;
    }
    // Parse and clamp between 0 and 100
    const num = Math.max(0, Math.min(100, Number(value)));
    setFormPercentage(isNaN(num) ? '' : num);
  };

  const handleDeleteGrade = async (grade: GradeDisplay) => {
    if (window.confirm(`Are you sure you want to delete this grade record?`)) {
      try {
        await gradesService.delete(grade.id);
        await loadGrades(); // Refresh the list
        setError(null);
      } catch (error: any) {
        setError(error.message || 'Failed to delete grade');
      }
    }
  };

  const handleSaveGrade = async () => {
    if (!formStudentId || !formSubject || formPercentage === '' || !formQuarter) {
      setError('Please fill Student, Subject, Percentage, and Quarter.');
      return;
    }
    
    try {
      if (editingGrade) {
        // Update existing grade
        const updateData: GradeUpdate = {
          student_id: formStudentId as number,
          subject: formSubject,
          grade: Number(formPercentage),
          max_grade: 100,
          semester: formQuarter,
          academic_year: '2024-2025',
          notes: formAssignment,
        };
        await gradesService.update(editingGrade.id, updateData);
      } else {
        // Create new grade
        const newGrade: GradeInsert = {
          student_id: formStudentId as number,
          subject: formSubject,
          grade: Number(formPercentage),
          max_grade: 100,
          semester: formQuarter,
          academic_year: '2024-2025',
          notes: formAssignment,
        };
        await gradesService.create(newGrade);
      }
      
      await loadGrades(); // Refresh the list
      setGradeDialogOpen(false);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to save grade');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Grading</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handleOpenPrint}
            disabled={students.length === 0}
          >
            Print Grades
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddGrade}
          >
            Add Grade
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Grades
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="Subject"
                >
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Term dropdown removed as requested */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  label="Grade Level"
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
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterList />}
                onClick={() => {
                  setSelectedSubject('');
                  setSelectedTerm('');
                  setSelectedGrade('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Grade Statistics */}
      {filteredGrades.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {filteredGrades.length}
                </Typography>
                <Typography variant="body2">Total Grades</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {Math.round(filteredGrades.reduce((sum, grade) => sum + grade.percentage, 0) / filteredGrades.length)}
                </Typography>
                <Typography variant="body2">Average %</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {filteredGrades.filter(g => g.grade === 'Outstanding').length}
                </Typography>
                <Typography variant="body2">Outstanding</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {filteredGrades.filter(g => g.grade === 'Did Not Meet Expectations').length}
                </Typography>
                <Typography variant="body2">Did Not Meet Expectations</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Grades Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Grade Records
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell align="center">Descriptor</TableCell>
                  <TableCell align="center">Percentage</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Quarter</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGrades.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.studentName}</TableCell>
                    <TableCell>{record.subject}</TableCell>
                    <TableCell>{record.assignment}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={record.grade}
                        color={getGradeColor(record.grade) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{record.percentage}%</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{quarterLabel((record as any).semester) || record.term}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Grade">
                        <IconButton
                          size="small"
                          onClick={() => handleEditGrade(record)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Grade">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGrade(record)}
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

      {/* Add/Edit Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGrade ? 'Edit Grade' : 'Add New Grade'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select label="Student" value={formStudentId} onChange={(e) => setFormStudentId(Number(e.target.value))}>
                  {students.length === 0 && <MenuItem value="" disabled>No students</MenuItem>}
                  {students.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select label="Subject" value={formSubject} onChange={(e) => setFormSubject(e.target.value)}>
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assignment/Test Name"
                value={formAssignment}
                onChange={(e) => setFormAssignment(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select
                  label="Quarter"
                  value={formQuarter}
                  onChange={(e) => setFormQuarter(e.target.value as any)}
                >
                  {quarters.map(q => (
                    <MenuItem key={q.value} value={q.value}>{q.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Percentage"
                type="number"
                value={formPercentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descriptor"
                value={formPercentage !== '' ? describePerformance(Number(formPercentage)) : ''}
                InputProps={{ readOnly: true }}
                helperText={formPercentage !== '' ? `${Number(formPercentage)}% → ${describePerformance(Number(formPercentage))}` : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {/* Term dropdown removed from Add/Edit dialog as requested */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveGrade}
          >
            {editingGrade ? 'Update' : 'Add'} Grade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Grades Dialog */}
      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Student to Print</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  label="Student"
                  value={printStudentId}
                  onChange={(e) => setPrintStudentId(Number(e.target.value))}
                >
                  {students.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}{s.lrn ? ` — LRN: ${s.lrn}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrintGrades}
            disabled={!printStudentId || printing}
          >
            {printing ? 'Generating...' : 'Generate PDF'}
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
      <Snackbar
        open={!!info}
        autoHideDuration={5000}
        onClose={() => setInfo(null)}
      >
        <Alert onClose={() => setInfo(null)} severity="info">
          {info}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Grading;
