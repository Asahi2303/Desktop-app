const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any electron-specific APIs here if needed
  platform: process.platform,
  versions: process.versions,
  db: {
    ping: async () => {
      return await ipcRenderer.invoke('db:ping');
    },
    findOne: async (collection, filter) => {
      return await ipcRenderer.invoke('db:findOne', { collection, filter });
    },
    insertOne: async (collection, document) => {
      return await ipcRenderer.invoke('db:insertOne', { collection, document });
    }
  }
  ,
  admin: {
    createStaffUser: async (name, email, role, redirectTo) => {
      return await ipcRenderer.invoke('auth:createStaffUser', { name, email, role, redirectTo });
    },
    diagnoseSupabase: async () => {
      return await ipcRenderer.invoke('auth:diagnoseSupabase');
    },
    testAdmin: async () => {
      return await ipcRenderer.invoke('auth:testAdmin');
    },
    generateInviteLink: async (email, redirectTo) => {
      return await ipcRenderer.invoke('auth:generateInviteLink', { email, redirectTo });
    },
    generateRecoveryLink: async (email, redirectTo) => {
      return await ipcRenderer.invoke('auth:generateRecoveryLink', { email, redirectTo });
    },
    setUserPassword: async (email, newPassword) => {
      return await ipcRenderer.invoke('auth:setUserPassword', { email, newPassword });
    },
    createOrUpdateUserWithPassword: async (email, password, name, role) => {
      return await ipcRenderer.invoke('auth:createOrUpdateUserWithPassword', { email, password, name, role });
    },
    // Data (service-role) APIs
    listStaff: async () => {
      return await ipcRenderer.invoke('admin:listStaff');
    },
    listUsers: async () => {
      return await ipcRenderer.invoke('admin:listUsers');
    },
    listGradeSections: async (academicYear) => {
      return await ipcRenderer.invoke('admin:listGradeSections', { academicYear });
    },
    addGradeSection: async (section) => {
      return await ipcRenderer.invoke('admin:addGradeSection', section);
    },
    removeGradeSectionByComposite: async (grade, section_name, academic_year) => {
      return await ipcRenderer.invoke('admin:removeGradeSectionByComposite', { grade, section_name, academic_year });
    },
    listSectionSubjects: async (sectionId) => {
      return await ipcRenderer.invoke('admin:listSectionSubjects', { sectionId });
    },
    createSectionSubject: async (row) => {
      return await ipcRenderer.invoke('admin:createSectionSubject', row);
    },
    updateSectionSubject: async (id, updates) => {
      return await ipcRenderer.invoke('admin:updateSectionSubject', { id, updates });
    },
    deleteSectionSubject: async (id) => {
      return await ipcRenderer.invoke('admin:deleteSectionSubject', { id });
    }
  }
});
