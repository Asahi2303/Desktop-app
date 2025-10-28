const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// Load environment variables from project root .env (ensure correct path in Electron)
try {
  const rootEnvPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
  } else {
    // Fallback to default lookup (cwd)
    require('dotenv').config();
  }
} catch (e) {
  // dotenv is optional; ignore if unavailable
}
const isDev = require('electron-is-dev');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

// Mitigate GPU process crashes on some Windows drivers
try { app.disableHardwareAcceleration(); } catch {}

let mainWindow;
let mongoClient; // Reused client for the app lifecycle
let mongoDb; // Selected database reference
let supabaseAdmin; // Supabase admin client (service key)

function shouldConnectMongo() {
  // Explicitly opt-in via ENABLE_MONGO=true to avoid noisy errors on machines without MongoDB
  return String(process.env.ENABLE_MONGO || '').toLowerCase() === 'true';
}

async function connectToMongo() {
  if (!shouldConnectMongo()) {
    return; // No-op unless explicitly enabled
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB || 'my_desktop_app';

  mongoClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  await mongoClient.connect();
  mongoDb = mongoClient.db(dbName);
}

function initSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase admin not initialized: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey);
}

function getIconPath() {
  const iconPng = path.join(__dirname, 'icon.png');
  const faviconIco = path.join(__dirname, 'favicon.ico');
  if (fs.existsSync(iconPng)) return iconPng;
  if (fs.existsSync(faviconIco)) return faviconIco;
  return undefined;
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: getIconPath(),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  const devUrl = 'http://localhost:3000';
  const fileUrl = `file://${path.join(__dirname, '../build/index.html')}`;
  const startUrl = isDev ? devUrl : fileUrl;

  // Try to load; if dev server isn't up, fall back to built index.html
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    const triedDev = (validatedURL || startUrl || '').startsWith('http://');
    if (triedDev) {
      console.warn('Dev server not available, falling back to built app:', errorDescription || errorCode);
      mainWindow.loadURL(fileUrl);
    }
  });

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  if (shouldConnectMongo()) {
    try {
      await connectToMongo();
    } catch (error) {
      // Log and continue to open the window so user can see an error UI if desired
      console.error('Failed to connect to MongoDB:', error);
    }
  } else {
    console.log('MongoDB connection disabled (set ENABLE_MONGO=true to enable).');
  }

  // Initialize Supabase Admin client
  initSupabaseAdmin();

  // IPC handlers
  ipcMain.handle('db:ping', async () => {
    if (!mongoClient) return { ok: false, error: 'Mongo client not initialized' };
    try {
      const admin = mongoDb.admin();
      const result = await admin.ping();
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  ipcMain.handle('db:findOne', async (event, { collection, filter }) => {
    if (!mongoDb) return { ok: false, error: 'Database is not available' };
    try {
      const doc = await mongoDb.collection(collection).findOne(filter || {});
      return { ok: true, doc };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  ipcMain.handle('db:insertOne', async (event, { collection, document }) => {
    if (!mongoDb) return { ok: false, error: 'Database is not available' };
    try {
      const result = await mongoDb.collection(collection).insertOne(document || {});
      return { ok: true, insertedId: result.insertedId };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // Auth/Admin: Invite Staff User by email (recommended)
  ipcMain.handle('auth:createStaffUser', async (event, { name, email, role, redirectTo }) => {
    if (!supabaseAdmin) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const details = {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey,
        urlSample: supabaseUrl ? String(supabaseUrl).slice(0, 24) + '...' : null,
        keySample: serviceRoleKey ? String(serviceRoleKey).slice(0, 6) + '...' : null,
      };
      return { ok: false, error: 'Supabase admin is not configured on this machine. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env and restart.', details };
    }
    try {
      const finalRedirect = redirectTo || process.env.SUPABASE_REDIRECT_TO || undefined;
      // Send an invitation email; user sets their own password via link
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          name,
          role,
          must_change_password: true,
        },
        redirectTo: finalRedirect,
      });
      if (error) {
        console.error('Invite error', {
          email,
          name,
          role,
          redirectTo: finalRedirect,
          message: error?.message,
          status: error?.status,
          code: error?.code,
          stack: error?.stack,
        });
        // Fallback: if user already exists/confirmed, generate a recovery link
        const msg = error.message || String(error);
        const code = error.status || error.code || null;
        try {
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: finalRedirect },
          });
          if (!linkError && linkData?.properties?.action_link) {
            return { ok: true, userId: data?.user?.id || null, invited: false, recoveryLink: linkData.properties.action_link };
          }
        } catch {}
        // Fallback 2: generate an invite link without sending email
        try {
          const { data: inviteLinkData, error: inviteLinkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: { redirectTo: finalRedirect },
          });
          if (!inviteLinkError && inviteLinkData?.properties?.action_link) {
            return { ok: true, userId: data?.user?.id || null, invited: false, inviteLink: inviteLinkData.properties.action_link };
          }
        } catch {}
        return { ok: false, error: msg, code };
      }

      // Also create a profile row in users table
      const profile = {
        id: data.user.id,
        email,
        name,
        role,
        avatar_url: null,
      };
      const { error: profileError } = await supabaseAdmin.from('users').insert(profile);
      if (profileError) {
        console.warn('Created auth user but failed to insert users profile:', profileError.message);
      }

  return { ok: true, userId: data.user.id, invited: true };
    } catch (e) {
      console.error('Invite handler exception', e);
      return { ok: false, error: String(e) };
    }
  });

  // Admin capability probe: verify service role works by listing users (masked)
  ipcMain.handle('auth:testAdmin', async () => {
    if (!supabaseAdmin) {
      return { ok: false, error: 'Admin client not initialized' };
    }
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) return { ok: false, error: error.message };
      return { ok: true, usersCount: data?.users?.length || 0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  // --- Admin data endpoints (service-role) ---
  ipcMain.handle('admin:listStaff', async () => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { data, error } = await supabaseAdmin.from('staff').select('*').order('created_at', { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:listUsers', async () => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { data, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:listGradeSections', async (event, { academicYear }) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { data, error } = await supabaseAdmin
      .from('grade_sections')
      .select('*')
      .eq('academic_year', academicYear)
      .order('grade', { ascending: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:addGradeSection', async (event, section) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { data, error } = await supabaseAdmin.from('grade_sections').insert(section).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:removeGradeSectionByComposite', async (event, { grade, section_name, academic_year }) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { error } = await supabaseAdmin
      .from('grade_sections')
      .delete()
      .eq('grade', grade)
      .eq('section_name', section_name)
      .eq('academic_year', academic_year);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

  ipcMain.handle('admin:listSectionSubjects', async (event, { sectionId }) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { data, error } = await supabaseAdmin
      .from('section_subjects')
      .select('*')
      .eq('section_id', sectionId)
      .order('subject', { ascending: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:createSectionSubject', async (event, row) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    // Sanitize payload: ensure teacher_id is a valid UUID or drop it; coerce staff_id to number/null
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
    const sanitize = (p) => {
      const out = { ...p };
      if ('teacher_id' in out && !isUuid(out.teacher_id)) delete out.teacher_id;
      if ('staff_id' in out) {
        if (out.staff_id === '' || out.staff_id == null) out.staff_id = null;
        else out.staff_id = Number(out.staff_id);
        if (!Number.isFinite(out.staff_id)) out.staff_id = null;
      }
      return out;
    };
    // If staff_id not present in schema, retry without it
    const attempt = async (payload) => supabaseAdmin.from('section_subjects').insert(sanitize(payload)).select().single();
    let { data, error } = await attempt(row);
    if (error && String(error.message || '').includes('staff_id')) {
      const { staff_id, ...rest } = row;
      const retry = await attempt(rest);
      if (retry.error) return { ok: false, error: retry.error.message };
      return { ok: true, data: retry.data };
    }
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:updateSectionSubject', async (event, { id, updates }) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
    const sanitize = (p) => {
      const out = { ...p };
      if ('teacher_id' in out && !isUuid(out.teacher_id)) delete out.teacher_id;
      if ('staff_id' in out) {
        if (out.staff_id === '' || out.staff_id == null) out.staff_id = null;
        else out.staff_id = Number(out.staff_id);
        if (!Number.isFinite(out.staff_id)) out.staff_id = null;
      }
      return out;
    };
    const attempt = async (payload) => supabaseAdmin
      .from('section_subjects')
      .update({ ...sanitize(payload), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    let { data, error } = await attempt(updates);
    if (error && String(error.message || '').includes('staff_id')) {
      const { staff_id, ...rest } = updates || {};
      const retry = await attempt(rest);
      if (retry.error) return { ok: false, error: retry.error.message };
      return { ok: true, data: retry.data };
    }
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  });

  ipcMain.handle('admin:deleteSectionSubject', async (event, { id }) => {
    if (!supabaseAdmin) return { ok: false, error: 'Admin client not initialized' };
    const { error } = await supabaseAdmin.from('section_subjects').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

  // Generate an invite link without sending email
  ipcMain.handle('auth:generateInviteLink', async (event, { email, redirectTo }) => {
    if (!supabaseAdmin) {
      return { ok: false, error: 'Admin client not initialized' };
    }
    try {
      // If redirectTo is explicitly null, omit redirect to use Supabase hosted form
      const finalRedirect = (redirectTo === null)
        ? undefined
        : (redirectTo || process.env.SUPABASE_REDIRECT_TO || undefined);
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo: finalRedirect },
      });
      if (error) return { ok: false, error: error.message };
      const link = data?.properties?.action_link || null;
      if (!link) return { ok: false, error: 'No invite link returned' };
      return { ok: true, link };
    } catch (e) {
      console.error('Generate invite link error', e);
      return { ok: false, error: String(e) };
    }
  });

  // Generate a password reset (recovery) link
  ipcMain.handle('auth:generateRecoveryLink', async (event, { email, redirectTo }) => {
    if (!supabaseAdmin) {
      return { ok: false, error: 'Admin client not initialized' };
    }
    try {
      // If redirectTo is explicitly null, omit redirect to use Supabase hosted form
      const finalRedirect = (redirectTo === null)
        ? undefined
        : (redirectTo || process.env.SUPABASE_REDIRECT_TO || undefined);
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: finalRedirect },
      });
      if (error) return { ok: false, error: error.message };
      const link = data?.properties?.action_link || null;
      if (!link) return { ok: false, error: 'No recovery link returned' };
      return { ok: true, link };
    } catch (e) {
      console.error('Generate recovery link error', e);
      return { ok: false, error: String(e) };
    }
  });

  // Set a user's password directly (admin only). Finds user by email and updates password.
  ipcMain.handle('auth:setUserPassword', async (event, { email, newPassword }) => {
    if (!supabaseAdmin) {
      return { ok: false, error: 'Admin client not initialized' };
    }
    try {
      // naive search over users to find by email
      let page = 1;
      const perPage = 1000;
      let foundUser = null;
      while (page < 100) { // hard cap to prevent infinite loop
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (error) return { ok: false, error: error.message };
        const users = data?.users || [];
        foundUser = users.find(u => (u?.email || '').toLowerCase() === String(email).toLowerCase());
        if (foundUser) break;
        if (users.length < perPage) break; // no more pages
        page += 1;
      }
      if (!foundUser) return { ok: false, error: 'User not found for email' };

      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
        password: newPassword,
      });
      if (updateError) return { ok: false, error: updateError.message };
      return { ok: true, userId: updated?.user?.id || foundUser.id };
    } catch (e) {
      console.error('Set user password error', e);
      return { ok: false, error: String(e) };
    }
  });

  // Create or update a Supabase Auth user with a specific password (no email flow)
  ipcMain.handle('auth:createOrUpdateUserWithPassword', async (event, { email, password, name, role }) => {
    if (!supabaseAdmin) {
      return { ok: false, error: 'Admin client not initialized' };
    }
    try {
      // Try create first
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role }
      });
      let userId = created?.user?.id || null;
      if (createErr) {
        // If already exists, find user and update password
        let page = 1; const perPage = 1000; let foundUser = null;
        while (page < 100) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
          if (error) return { ok: false, error: error.message };
          const users = data?.users || [];
          foundUser = users.find(u => (u?.email || '').toLowerCase() === String(email).toLowerCase());
          if (foundUser) break;
          if (users.length < perPage) break;
          page += 1;
        }
        if (!foundUser) return { ok: false, error: createErr.message || 'Failed to create or find user' };
        userId = foundUser.id;
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (updErr) return { ok: false, error: updErr.message };
      }

      // Ensure profile row exists/updated in users table
      if (userId) {
        try {
          const { data: existingProfile, error: selErr } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          if (selErr) {
            // Insert if not found
            await supabaseAdmin.from('users').insert({ id: userId, email, name, role, avatar_url: null });
          } else {
            // Update name/role if changed
            await supabaseAdmin
              .from('users')
              .update({ name, role, updated_at: new Date().toISOString() })
              .eq('id', userId);
          }
        } catch (e) {
          // Non-fatal
          console.warn('Profile ensure warning:', e);
        }
      }

      return { ok: true, userId };
    } catch (e) {
      console.error('createOrUpdateUserWithPassword error', e);
      return { ok: false, error: String(e) };
    }
  });

  // Diagnostics: return whether admin env vars are visible (masked)
  ipcMain.handle('auth:diagnoseSupabase', async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlSample: supabaseUrl ? String(supabaseUrl).slice(0, 24) + '...' : null,
      keySample: serviceRoleKey ? String(serviceRoleKey).slice(0, 6) + '...' : null,
    };
  });

  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  if (mongoClient) {
    try {
      await mongoClient.close();
    } catch (e) {
      console.error('Error closing MongoDB client:', e);
    }
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
