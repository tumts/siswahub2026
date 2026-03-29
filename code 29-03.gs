/**
 * SiswaHub Pro SMP - Backend Production Version
 * Database: Google Sheets
 * Storage: Google Drive
 */

const SPREADSHEET_ID = ''; 
const FOLDER_DRIVE_ID = ''; 

/**
 * 1. FUNGSI SETUP DATABASE
 */
function setupDatabase() {
  if (!SPREADSHEET_ID) throw new Error("SPREADSHEET_ID belum diisi!");
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SUPER_ADMIN_USER')) {
    props.setProperty('SUPER_ADMIN_USER', 'admin');
    props.setProperty('SUPER_ADMIN_PASS', '20277715');
  }
  if (!props.getProperty('VIEWER_ADMIN_USER')) {
    props.setProperty('VIEWER_ADMIN_USER', 'pantau');
    props.setProperty('VIEWER_ADMIN_PASS', 'pantau123');
  }

  let sheetSiswa = ss.getSheetByName('DataSiswa');
  if (!sheetSiswa) sheetSiswa = ss.insertSheet('DataSiswa');
  const headersSiswa = [
    'nisn', 'nama', 'kelas', 'rombel', 'wa_siswa', 'email_siswa', 
    'status_ayah', 'nama_ayah', 'wa_ayah', 'email_ayah', 
    'status_ibu', 'nama_ibu', 'wa_ibu', 'email_ibu', 
    'link_kartukeluarga', 'link_ijazah', 'kode_akses', 
    'is_active', 'is_locked', 'progres_persen', 'status_verifikasi', 'catatan_perbaikan', 'last_update'
  ];
  sheetSiswa.getRange(1, 1, 1, headersSiswa.length).setValues([headersSiswa]).setFontWeight('bold').setBackground('#e2e8f0');

  let sheetWali = ss.getSheetByName('DataWali');
  if (!sheetWali) sheetWali = ss.insertSheet('DataWali');
  const headersWali = ['username', 'kode', 'nama', 'target_kelas', 'target_rombel'];
  sheetWali.getRange(1, 1, 1, headersWali.length).setValues([headersWali]).setFontWeight('bold').setBackground('#e2e8f0');

  let sheetAdmin = ss.getSheetByName('DataAdmin');
  if (!sheetAdmin) {
    sheetAdmin = ss.insertSheet('DataAdmin');
    const headersAdmin = ['username', 'password', 'role', 'nama_pengguna'];
    sheetAdmin.getRange(1, 1, 1, headersAdmin.length).setValues([headersAdmin]).setFontWeight('bold').setBackground('#e2e8f0');
    const defaultAdmins = [['admin', '20277715', 'super_admin', 'Administrator Utama'], ['pantau', 'pantau123', 'viewer_admin', 'Admin Pemantau']];
    sheetAdmin.getRange(2, 1, defaultAdmins.length, headersAdmin.length).setValues(defaultAdmins);
  }

  let sheetConfig = ss.getSheetByName('AppSettings');
  if (!sheetConfig) sheetConfig = ss.insertSheet('AppSettings');
  
  let sheetChat = ss.getSheetByName('DataChat');
  if (sheetChat) ss.deleteSheet(sheetChat);

  return "Setup Database Berhasil (Chat DB Dihapus)!";
}

/**
 * 2. ROUTING WEB APP
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SiswaHub Pro SMP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 3. FUNGSI PENGAMBILAN DATA (READ)
 */
function getInitialData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const sheetSiswa = ss.getSheetByName('DataSiswa');
  let students = [];
  if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    const headersSiswa = dataSiswa[0];
    students = dataSiswa.slice(1).map(row => {
      let obj = {};
      headersSiswa.forEach((h, i) => obj[h] = row[i]);
      obj.is_active = String(obj.is_active).toLowerCase() === 'true';
      obj.is_locked = String(obj.is_locked).toLowerCase() === 'true';
      obj.progres_persen = parseInt(obj.progres_persen) || 0;
      return obj;
    });
  }

  const sheetWali = ss.getSheetByName('DataWali');
  let teachers = [];
  if (sheetWali && sheetWali.getLastRow() > 1) {
    const dataWali = sheetWali.getDataRange().getValues();
    const headersWali = dataWali[0];
    teachers = dataWali.slice(1).map(row => {
      let obj = {};
      headersWali.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  }

  const sheetConfig = ss.getSheetByName('AppSettings');
  let config = {};
  if (sheetConfig && sheetConfig.getLastRow() > 0) {
    const configData = sheetConfig.getDataRange().getValues();
    configData.forEach(row => {
      try { config[row[0]] = JSON.parse(row[1]); } catch(e) { config[row[0]] = row[1]; }
    });
  }

  return JSON.stringify({ students, teachers, config });
}

/**
 * 4. FUNGSI PENYIMPANAN DATA (WRITE)
 */
function updateStudentData(studentObj) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataSiswa');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nisnIdx = headers.indexOf('nisn');
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][nisnIdx] == studentObj.nisn) { rowIndex = i + 1; break; }
  }

  const rowValues = headers.map(h => studentObj[h] !== undefined ? studentObj[h] : '');
  if (rowIndex !== -1) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  else sheet.appendRow(rowValues);
  
  return { success: true };
}

function updateTeacherData(teacherObj) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataWali');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdx = headers.indexOf('username');
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][userIdx] == teacherObj.username) { rowIndex = i + 1; break; }
  }

  const rowValues = headers.map(h => teacherObj[h] !== undefined ? teacherObj[h] : '');
  if (rowIndex !== -1) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  else sheet.appendRow(rowValues);
  
  return { success: true };
}

function updateAppSettings(configObj) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('AppSettings');
  sheet.clear();
  const rows = Object.keys(configObj).map(key => {
    const val = typeof configObj[key] === 'object' ? JSON.stringify(configObj[key]) : configObj[key];
    return [key, val];
  });
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  return { success: true };
}

/**
 * 5. FUNGSI VERIFIKASI ADMIN & ROLE
 */
function verifyAdminLogin(identity, kode) {
  const props = PropertiesService.getScriptProperties();
  if (identity === props.getProperty('SUPER_ADMIN_USER') && kode === props.getProperty('SUPER_ADMIN_PASS')) {
    return { success: true, role: 'super_admin', nama_pengguna: 'Root Admin' };
  }
  
  const sheetAdmin = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataAdmin');
  if (sheetAdmin && sheetAdmin.getLastRow() > 1) {
    const dataAdmin = sheetAdmin.getDataRange().getValues();
    for (let i = 1; i < dataAdmin.length; i++) {
      if (String(dataAdmin[i][0]) === identity && String(dataAdmin[i][1]) === kode) {
        return { success: true, role: dataAdmin[i][2], nama_pengguna: dataAdmin[i][3] };
      }
    }
  }
  return { success: false };
}

function getAdminUsers() {
  const sheetAdmin = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataAdmin');
  if (!sheetAdmin || sheetAdmin.getLastRow() <= 1) return JSON.stringify([]);
  
  const data = sheetAdmin.getDataRange().getValues();
  const headers = data[0];
  const admins = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return JSON.stringify(admins);
}

function updateAdminUser(adminObj, isDelete = false) {
  const sheetAdmin = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataAdmin');
  const data = sheetAdmin.getDataRange().getValues();
  const headers = data[0];
  const userIdx = headers.indexOf('username');
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdx]) === String(adminObj.username)) { rowIndex = i + 1; break; }
  }

  if (isDelete) {
    if (rowIndex !== -1) sheetAdmin.deleteRow(rowIndex);
    return { success: true };
  }

  const rowValues = headers.map(h => adminObj[h] !== undefined ? adminObj[h] : '');
  if (rowIndex !== -1) sheetAdmin.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  else sheetAdmin.appendRow(rowValues);
  
  return { success: true };
}

/**
 * 6. FUNGSI UPLOAD BERKAS KE DRIVE (DENGAN ACADEMIC YEAR STAMP)
 */
function uploadFileToDrive(base64Data, fileNamePrefix, fileType) {
  try {
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const folder = DriveApp.getFolderById(FOLDER_DRIVE_ID);
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType);
    
    // Bersihkan karakter aneh pada nama dari frontend
    const sanitizedPrefix = fileNamePrefix.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    
    // Sisipkan Tahun Ajaran agar rapi saat kelas berubah tahun depan
    const currentYear = new Date().getFullYear();
    const academicYear = `TA${currentYear}`;
    
    blob.setName(`${academicYear}_${sanitizedPrefix}_${fileType}`);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, url: `https://lh3.googleusercontent.com/d/${file.getId()}` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
