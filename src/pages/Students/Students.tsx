import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  Add,
  Delete,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { studentsService, Student } from '../../services/database';
import { getSectionsForGrade } from '../../lib/gradeSections';
import type { User } from '../../services/auth';

// Transform the database student to match component interface
interface StudentDisplay extends Student {
  firstName: string;
  lastName: string;
  enrollmentDate: string;
}

interface StudentsProps {
  currentUser?: User;
}

const Students: React.FC<StudentsProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentDisplay | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [students, setStudents] = useState<StudentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isAdmin = useMemo(() => currentUser?.role === 'Admin', [currentUser]);

  // More Filters state
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');


  // Load students from Supabase
  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getAll();
      // Transform data to match component interface
      const transformedStudents: StudentDisplay[] = data.map(student => ({
        ...student,
        firstName: student.first_name,
        lastName: student.last_name,
        enrollmentDate: student.enrollment_date,
      }));
      setStudents(transformedStudents);
    } catch (error: any) {
      setError(error.message || 'Failed to load students');
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lrn ? student.lrn.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    
    const matchesFilter = filterStatus === 'All' || student.status === filterStatus;
    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesSection = !filterSection || student.section === filterSection;
    const d = new Date(student.enrollmentDate);
    const matchesFrom = !filterFromDate || d >= new Date(filterFromDate);
    const matchesTo = !filterToDate || d <= new Date(filterToDate);
    
    return matchesSearch && matchesFilter && matchesGrade && matchesSection && matchesFrom && matchesTo;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Graduated': return 'info';
      default: return 'default';
    }
  };

  // Removed edit menu/button handlers as requested

  const handleDeleteStudent = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedStudent) {
      try {
        await studentsService.delete(selectedStudent.id);
        // Refresh the students list
        await loadStudents();
        setError(null);
        setSuccess('Student deleted successfully');
      } catch (error: any) {
        setError(error.message || 'Failed to delete student');
      }
    }
    setDeleteDialogOpen(false);
  };

  // Editing students disabled in this view per request

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32 }}>
          {params.row.firstName[0]}{params.row.lastName[0]}
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.firstName} {params.row.lastName}{params.row.suffix ? ` ${params.row.suffix}` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'grade',
      headerName: 'Grade',
      width: 100,
      renderCell: (params) => (
        <Chip label={`Grade ${params.row.grade}`} size="small" variant="outlined" />
      ),
    },
    {
      field: 'section',
      headerName: 'Section',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={getStatusColor(params.row.status) as any}
        />
      ),
    },
    {
      field: 'enrollmentDate',
      headerName: 'Enrolled',
      width: 120,
      renderCell: (params) => new Date(params.row.enrollmentDate).toLocaleDateString(),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            icon={<Visibility />}
            label="View"
            onClick={() => navigate(`/students/${params.id}`)}
          />,
        ];
        if (isAdmin) {
          actions.push(
            <GridActionsCellItem
              icon={<Delete />}
              label="Delete"
              onClick={() => {
                setSelectedStudent(params.row);
                setDeleteDialogOpen(true);
              }}
            />
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Students</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/enrollment')}
          >
            Add Student
          </Button>
        )}
      </Box>

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
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <SelectMenuItem value="All">All</SelectMenuItem>
                <SelectMenuItem value="Active">Active</SelectMenuItem>
                <SelectMenuItem value="Inactive">Inactive</SelectMenuItem>
                <SelectMenuItem value="Graduated">Graduated</SelectMenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setMoreFiltersOpen(true)}
            >
              More Filters
            </Button>
          </Box>

          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredStudents}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedStudent?.firstName} {selectedStudent?.lastName}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Filters Dialog */}
      <Dialog open={moreFiltersOpen} onClose={() => setMoreFiltersOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>More Filters</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    label="Grade"
                    value={filterGrade}
                    onChange={(e) => {
                      setFilterGrade(e.target.value);
                      // Reset section if grade changes
                      setFilterSection('');
                    }}
                  >
                    <SelectMenuItem value="">Any</SelectMenuItem>
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const g = String(idx + 1);
                      return (
                        <SelectMenuItem key={g} value={g}>Grade {g}</SelectMenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!filterGrade}>
                  <InputLabel>Section</InputLabel>
                  <Select
                    label="Section"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                  >
                    <SelectMenuItem value="">Any</SelectMenuItem>
                    {(() => {
                      const configured = getSectionsForGrade(filterGrade);
                      const dynamicSections = students
                        .filter(s => !filterGrade || s.grade === filterGrade)
                        .map(s => s.section);
                      const unique = Array.from(new Set([...(configured || []), ...dynamicSections]));
                      return unique.map(sec => (
                        <SelectMenuItem key={sec} value={sec}>{sec}</SelectMenuItem>
                      ));
                    })()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Enrollment From"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Enrollment To"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFilterGrade('');
              setFilterSection('');
              setFilterFromDate('');
              setFilterToDate('');
            }}
          >
            Clear
          </Button>
          <Button variant="contained" onClick={() => setMoreFiltersOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Dialog removed as requested */}
    </Box>
  );
};

export default Students;
