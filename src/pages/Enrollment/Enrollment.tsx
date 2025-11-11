import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Person,
  School,
  CheckCircle,
} from '@mui/icons-material';
import { studentsService, StudentInsert } from '../../services/database';
import { getSectionsForGrade } from '../../lib/gradeSections';

const Enrollment: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Student Information
    firstName: '',
    suffix: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  lrn: '',
    address: '',
    gender: '',
    
    // Academic Information
    grade: '',
    section: '',
    previousSchool: '',
    academicYear: '2024-2025',
    
    // Parent/Guardian Information
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelationship: '',
    emergencyContact: '',
    emergencyPhone: '',
    
    // Payment Information (removed)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load draft form if exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem('enrollmentDraft');
      if (raw) {
        const draft = JSON.parse(raw);
        setFormData((prev) => ({ ...prev, ...draft }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave draft on change
  useEffect(() => {
    try {
      localStorage.setItem('enrollmentDraft', JSON.stringify(formData));
    } catch {
      // ignore
    }
  }, [formData]);

  const steps = [
    { label: 'Student Information', icon: <Person /> },
    { label: 'Academic Details', icon: <School /> },
    { label: 'Parent/Guardian', icon: <Person /> },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        // suffix optional
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.lrn) newErrors.lrn = 'LRN is required';
        else if (!/^\d+$/.test(String(formData.lrn))) newErrors.lrn = 'LRN must be numeric';
        break;
      case 1:
        if (!formData.grade) newErrors.grade = 'Grade is required';
        if (!formData.section) newErrors.section = 'Section is required';
        break;
      case 2:
        if (!formData.parentName) newErrors.parentName = 'Parent/Guardian name is required';
        if (!formData.parentPhone) newErrors.parentPhone = 'Parent phone is required';
        if (!formData.parentEmail) newErrors.parentEmail = 'Parent email is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(activeStep)) {
      try {
        setLoading(true);
        setError(null);
        
  // Do NOT include suffix in full_name/normalized_full_name
  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  const normalized = fullName.toLowerCase();
        const newStudent: StudentInsert = {
          first_name: formData.firstName,
          suffix: formData.suffix || undefined,
          last_name: formData.lastName,
          full_name: fullName,
          normalized_full_name: normalized,
          email: formData.email,
          lrn: formData.lrn || undefined,
          grade: formData.grade,
          section: formData.section,
          status: 'Active',
          enrollment_date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        };

        const createdStudent = await studentsService.create(newStudent);
        
        // Clear draft
        localStorage.removeItem('enrollmentDraft');
        
        setSuccess(true);
        
        // Navigate to students page after a short delay
        setTimeout(() => {
          navigate('/students');
        }, 1500);
        
      } catch (error: any) {
        setError(error.message || 'Failed to enroll student');
        console.error('Error enrolling student:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Suffix</InputLabel>
                <Select
                  value={formData.suffix}
                  label="Suffix"
                  onChange={(e) => handleInputChange('suffix', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Jr.">Jr.</MenuItem>
                  <MenuItem value="Sr.">Sr.</MenuItem>
                  <MenuItem value="II">II</MenuItem>
                  <MenuItem value="III">III</MenuItem>
                  <MenuItem value="IV">IV</MenuItem>
                  <MenuItem value="V">V</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="LRN"
                value={formData.lrn}
                onChange={(e) => handleInputChange('lrn', e.target.value.trim())}
                error={!!errors.lrn}
                helperText={errors.lrn}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.grade}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  label="Grade"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                    <MenuItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.section}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  label="Section"
                  disabled={!formData.grade}
                >
                  {getSectionsForGrade(formData.grade).length === 0 ? (
                    <MenuItem disabled value="">
                      {formData.grade ? 'No sections configured for this grade' : 'Select grade first'}
                    </MenuItem>
                  ) : (
                    getSectionsForGrade(formData.grade).map(section => (
                      <MenuItem key={section} value={section}>
                        {section}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Previous School"
                value={formData.previousSchool}
                onChange={(e) => handleInputChange('previousSchool', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academicYear}
                onChange={(e) => handleInputChange('academicYear', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent/Guardian Name"
                value={formData.parentName}
                onChange={(e) => handleInputChange('parentName', e.target.value)}
                error={!!errors.parentName}
                helperText={errors.parentName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parentPhone}
                onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                error={!!errors.parentPhone}
                helperText={errors.parentPhone}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                error={!!errors.parentEmail}
                helperText={errors.parentEmail}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={formData.parentRelationship}
                  onChange={(e) => handleInputChange('parentRelationship', e.target.value)}
                  label="Relationship"
                >
                  <MenuItem value="Father">Father</MenuItem>
                  <MenuItem value="Mother">Mother</MenuItem>
                  <MenuItem value="Guardian">Guardian</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Phone"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Student Enrollment
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Enroll a new student in the school system.
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel icon={step.icon}>
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4 }}>
            {getStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<CheckCircle />}
                  disabled={loading}
                >
                  {loading ? 'Enrolling...' : 'Complete Enrollment'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

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
          Student enrolled successfully! Redirecting to students page...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Enrollment;
