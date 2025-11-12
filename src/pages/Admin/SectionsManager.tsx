import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import { gradeSectionsService, sectionSubjectsService, GradeSectionRow, SectionSubjectRow } from '../../services/database';
import { staffService } from '../../services/database';
import type { Staff } from '../../services/database';

const dayOptions = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
];

const SectionsManager: React.FC = () => {
  const [year, setYear] = useState('2024-2025');
  const [grade, setGrade] = useState<string>('1');
  const [sections, setSections] = useState<GradeSectionRow[]>([]);
  const [newSection, setNewSection] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<SectionSubjectRow[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newTeacherId, setNewTeacherId] = useState<number | ''>('');
  type TeacherOption = { id: number; name: string; email: string; department: string };
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [scheduleDraft, setScheduleDraft] = useState<{ days: number[]; start: string; end: string; room?: string }>({ days: [], start: '', end: '', room: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warnMsg, setWarnMsg] = useState<string | null>(null);
  const [adminDiag, setAdminDiag] = useState<{ available: boolean; hasUrl: boolean; hasServiceKey: boolean } | null>(null);
  // Confirm remove dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sectionToRemove, setSectionToRemove] = useState<GradeSectionRow | null>(null);
  const toMessage = (e: any): string => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e?.message) return String(e.message);
    if (e?.error) return String(e.error);
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  const gradeSections = useMemo(() => sections.filter(s => String(s.grade) === grade), [sections, grade]);
  const selectedSection = useMemo(() => sections.find(s => s.id === selectedSectionId) || null, [sections, selectedSectionId]);

  const loadSections = async () => {
    try {
      setErrorMsg(null);
      const data = await gradeSectionsService.list(year);
      setSections(data);
      // maintain selection if still present
      if (selectedSectionId && !data.find(s => s.id === selectedSectionId)) {
        setSelectedSectionId(null);
      }
    } catch (e: any) {
      console.error('Failed to load sections:', e);
      setErrorMsg(toMessage(e) || 'Failed to load sections. Check Supabase URL/key and RLS.');
      setSections([]);
    }
  };

  const loadSubjects = async (sectionId: number) => {
    try {
      setErrorMsg(null);
      const data = await sectionSubjectsService.listBySection(sectionId);
      setSubjects(data);
    } catch (e: any) {
      console.error('Failed to load subjects:', e);
      setErrorMsg(toMessage(e) || 'Failed to load subjects.');
      setSubjects([]);
    }
  };

  const loadTeachers = async () => {
    try {
      const staff = await staffService.getAll();
      const academicStaff = staff
        .filter(s => (s.department || '').trim().toLowerCase() === 'academics' && s.status === 'Active')
        .map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}`.trim(), email: s.email, department: s.department }));
      const finalOptions = academicStaff.sort((a, b) => a.name.localeCompare(b.name));
      setTeachers(finalOptions);
    } catch (e) {
      console.warn('Failed to load teachers from staff; falling back to empty list', e);
      setTeachers([]);
    }
  };

  // No account creation needed; teacher selection is sourced directly from staff table

  useEffect(() => {
    loadSections();
    loadTeachers();
    // eslint-disable-next-line
  }, [year]);

  useEffect(() => {
    // Gather desktop admin (service-role) diagnostics without forcing an error banner
    const anyWindow: any = typeof window !== 'undefined' ? (window as any) : undefined;
    (async () => {
      try {
        if (anyWindow?.electronAPI?.admin?.diagnoseSupabase) {
          const res = await anyWindow.electronAPI.admin.diagnoseSupabase();
          setAdminDiag({ available: true, hasUrl: !!res?.hasUrl, hasServiceKey: !!res?.hasServiceKey });
        } else {
          setAdminDiag({ available: false, hasUrl: false, hasServiceKey: false });
        }
      } catch {
        setAdminDiag({ available: false, hasUrl: false, hasServiceKey: false });
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      loadSubjects(selectedSectionId);
    } else {
      setSubjects([]);
    }
  }, [selectedSectionId]);

  const addSection = async () => {
    const name = newSection.trim();
    if (!name) return;
    try {
      await gradeSectionsService.add({ grade: Number(grade), section_name: name, academic_year: year });
      setNewSection('');
      await loadSections();
      setSuccessMsg('Section added.');
    } catch (e: any) {
      console.error('Failed to add section:', e);
      setErrorMsg(toMessage(e) || 'Failed to add section.');
    }
  };

  const removeSection = async (row: GradeSectionRow) => {
    try {
      await gradeSectionsService.removeByComposite(row.grade, row.section_name, row.academic_year);
      if (selectedSectionId === row.id) setSelectedSectionId(null);
      await loadSections();
      setSuccessMsg('Section removed.');
    } catch (e: any) {
      console.error('Failed to remove section:', e);
      setErrorMsg(toMessage(e) || 'Failed to remove section.');
    }
  };

  const askRemoveSection = (row: GradeSectionRow) => {
    setSectionToRemove(row);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (sectionToRemove) {
      await removeSection(sectionToRemove);
    }
    setConfirmOpen(false);
    setSectionToRemove(null);
  };

  const handleCancelRemove = () => {
    setConfirmOpen(false);
    setSectionToRemove(null);
  };

  const addSubject = async () => {
    if (!selectedSectionId) return;
    const subj = newSubject.trim();
    if (!subj || !newTeacherId) return;
    try {
      await sectionSubjectsService.create({ section_id: selectedSectionId, subject: subj, staff_id: Number(newTeacherId), schedule: scheduleDraft });
      setNewSubject('');
      setNewTeacherId('');
      setScheduleDraft({ days: [], start: '', end: '', room: '' });
      await loadSubjects(selectedSectionId);
      setSuccessMsg('Subject added and saved.');
    } catch (e: any) {
      console.error('Failed to add subject:', e);
      setErrorMsg(toMessage(e) || 'Failed to add subject.');
    }
  };

  const saveSubject = async (row: SectionSubjectRow) => {
    try {
      setErrorMsg(null);
      const staffId = (row as any).staff_id;
      await sectionSubjectsService.update(row.id, { subject: row.subject, staff_id: (staffId === '' ? null : staffId ?? null), schedule: row.schedule || null });
      if (selectedSectionId) {
        await loadSubjects(selectedSectionId);
        setSuccessMsg('Subject changes saved.');
        // Warn if DB dropped staff assignment (likely missing staff_id column)
        const saved = subjects.find(s => s.id === row.id);
        if ((staffId ?? null) && (saved as any)?.staff_id == null) {
          setWarnMsg('Teacher assignment could not be stored. Make sure your database has section_subjects.staff_id.');
        } else {
          setWarnMsg(null);
        }
      }
    } catch (e: any) {
      console.error('Failed to save subject:', e);
      setErrorMsg(toMessage(e) || 'Failed to save subject.');
    }
  };

  const removeSubject = async (id: number) => {
    try {
      await sectionSubjectsService.remove(id);
      if (selectedSectionId) await loadSubjects(selectedSectionId);
      setSuccessMsg('Subject removed.');
    } catch (e: any) {
      console.error('Failed to remove subject:', e);
      setErrorMsg(toMessage(e) || 'Failed to remove subject.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Grades & Sections</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage sections, assign subjects and define schedules.</Typography>
      {errorMsg && (
        <Box sx={{ mb: 2, p: 2, borderRadius: 1, border: '1px solid', borderColor: 'error.main', color: 'error.main' }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>{errorMsg}</Typography>
          <Typography variant="caption" color="text.secondary">
            {(() => {
              const w: any = typeof window !== 'undefined' ? (window as any) : undefined;
              const hasElectronAdmin = !!(w?.electronAPI?.admin);
              if (hasElectronAdmin && adminDiag) {
                if (!adminDiag.hasUrl || !adminDiag.hasServiceKey) {
                  return 'Desktop admin (service role) not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env at project root, then restart the desktop app.';
                }
                return 'A database permission or schema issue occurred. Since desktop admin is configured, this may be a missing column or constraint—check migrations and reload schema.';
              }
              return 'Running without desktop admin. Ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in the web app environment, and add RLS policies for grade_sections/section_subjects/staff or run via the desktop app with service role.';
            })()}
          </Typography>
        </Box>
      )}
      {successMsg && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
        </Box>
      )}
      {warnMsg && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="warning" onClose={() => setWarnMsg(null)}>{warnMsg}</Alert>
        </Box>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select label="Academic Year" value={year} onChange={(e) => setYear(e.target.value)}>
                  <MenuItem value="2024-2025">2024-2025</MenuItem>
                  <MenuItem value="2025-2026">2025-2026</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select label="Grade" value={grade} onChange={(e) => setGrade(String(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(g => (
                    <MenuItem key={g} value={g}>Grade {g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder="New section name (e.g., Sampaguita)" value={newSection} onChange={(e) => setNewSection(e.target.value)} />
                <Button variant="contained" startIcon={<Add />} onClick={addSection}>Add</Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {gradeSections.map(row => (
              <Grid item xs={12} sm={6} md={4} key={row.id}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderColor: selectedSectionId === row.id ? 'primary.main' : 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {row.section_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Grade {row.grade} • {row.academic_year}
                    </Typography>
                  </Box>
                  <CardActions sx={{ mt: 1, justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      size="small"
                      variant={selectedSectionId === row.id ? 'contained' : 'outlined'}
                      onClick={() => setSelectedSectionId(row.id)}
                    >
                      Manage
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => askRemoveSection(row)}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {gradeSections.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">No sections for this grade and year yet.</Typography>
                  {!errorMsg && (
                    <Typography variant="caption" color="text.secondary">
                      If you expect sections here:
                      1) Confirm the academic year matches rows in grade_sections.
                      2) Ensure RLS policies allow SELECT for your role (or test in SQL Editor).
                      3) Verify REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY are set in your web environment.
                      4) If the table is missing, run database/create-grade-sections-table.sql and database/rls_policies_all.sql then reload.
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {selectedSection && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Subjects for {selectedSection.section_name} (Grade {selectedSection.grade})</Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Teacher/Manager</InputLabel>
                  <Select label="Teacher/Manager" value={newTeacherId} onChange={(e) => setNewTeacherId(e.target.value === '' ? '' : Number(e.target.value))}>
                    <MenuItem value=""><em>Select a teacher</em></MenuItem>
                    {teachers.map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.name} • {t.email} • {t.department}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={5}>
                <FormGroup row>
                  {dayOptions.map(d => (
                    <FormControlLabel key={d.value} control={<Checkbox size="small" checked={scheduleDraft.days.includes(d.value)} onChange={(e) => {
                      setScheduleDraft(prev => ({ ...prev, days: e.target.checked ? Array.from(new Set([...prev.days, d.value])) : prev.days.filter(x => x !== d.value) }));
                    }} />} label={d.label} />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth size="small" label="Start" type="time" InputLabelProps={{ shrink: true }} value={scheduleDraft.start} onChange={(e) => setScheduleDraft(prev => ({ ...prev, start: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth size="small" label="End" type="time" InputLabelProps={{ shrink: true }} value={scheduleDraft.end} onChange={(e) => setScheduleDraft(prev => ({ ...prev, end: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Room" value={scheduleDraft.room} onChange={(e) => setScheduleDraft(prev => ({ ...prev, room: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth variant="contained" startIcon={<Add />} onClick={addSubject} disabled={!newSubject.trim() || !newTeacherId}>Add Subject</Button>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {subjects.map((s) => (
                <Grid item xs={12} key={s.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField fullWidth size="small" label="Subject" value={s.subject} onChange={(e) => setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, subject: e.target.value } : x))} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Teacher/Manager</InputLabel>
                          <Select
                            label="Teacher/Manager"
                            value={((s as any).staff_id == null ? '' : Number((s as any).staff_id)) as any}
                            onChange={(e) => setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, staff_id: (e.target.value === '' ? null : Number(e.target.value)) } : x))}
                          >
                            <MenuItem value=""><em>Unassigned</em></MenuItem>
                            {teachers.map(t => (
                              <MenuItem key={t.id} value={t.id}>{t.name} • {t.email} • {t.department}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField fullWidth size="small" label="Days (e.g., 1,3,5)" value={Array.isArray((s as any).schedule?.days) ? (s as any).schedule.days.join(',') : ''}
                          onChange={(e) => {
                            const days = e.target.value.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n));
                            setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, schedule: { ...(x as any).schedule, days } } : x));
                          }} />
                      </Grid>
                      <Grid item xs={6} sm={1.5}>
                        <TextField fullWidth size="small" label="Start" type="time" InputLabelProps={{ shrink: true }} value={(s as any).schedule?.start || ''} onChange={(e) => setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, schedule: { ...(x as any).schedule, start: e.target.value } } : x))} />
                      </Grid>
                      <Grid item xs={6} sm={1.5}>
                        <TextField fullWidth size="small" label="End" type="time" InputLabelProps={{ shrink: true }} value={(s as any).schedule?.end || ''} onChange={(e) => setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, schedule: { ...(x as any).schedule, end: e.target.value } } : x))} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField fullWidth size="small" label="Room" value={(s as any).schedule?.room || ''} onChange={(e) => setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, schedule: { ...(x as any).schedule, room: e.target.value } } : x))} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant="contained" size="small" startIcon={<Save />} onClick={() => saveSubject(s)}>Save</Button>
                          <IconButton color="error" onClick={() => removeSubject(s.id)}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))}
              {subjects.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">No subjects assigned yet.</Typography>
                </Grid>
              )}
            </Grid>

            {/* Read-only saved view */}
            {subjects.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Saved subjects</Typography>
                <Grid container spacing={1}>
                  {subjects.map(s => {
                    const staffIdNum = (s as any).staff_id == null ? null : Number((s as any).staff_id);
                    const t = teachers.find(t => t.id === (staffIdNum as any));
                    const days = Array.isArray((s as any).schedule?.days) ? (s as any).schedule.days as number[] : [];
                    const dayNames = days
                      .sort((a,b)=>a-b)
                      .map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d] || String(d))
                      .join(', ');
                    const start = (s as any).schedule?.start || '';
                    const end = (s as any).schedule?.end || '';
                    const room = (s as any).schedule?.room || '';
                    return (
                      <Grid item xs={12} md={6} key={`saved-${s.id}`}>
                        <Card variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="subtitle2">{s.subject}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t ? `${t.name} • ${t.email}` : 'Unassigned'}{dayNames ? ` • ${dayNames}` : ''}{start && end ? ` • ${start}–${end}` : ''}{room ? ` • Room ${room}` : ''}
                          </Typography>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      )}
      {/* Confirm Remove Section Dialog */}
      <Dialog open={confirmOpen} onClose={handleCancelRemove} aria-labelledby="confirm-remove-title">
        <DialogTitle id="confirm-remove-title">Remove section?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {sectionToRemove ? (
              <>Are you sure you want to remove section "{sectionToRemove.section_name}" for Grade {sectionToRemove.grade} ({sectionToRemove.academic_year})? This action cannot be undone.</>
            ) : (
              <>Are you sure you want to remove this section? This action cannot be undone.</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmRemove} autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SectionsManager;
