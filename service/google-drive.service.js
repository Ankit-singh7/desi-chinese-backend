const { google } = require('googleapis');
const stream = require('stream');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('✅ New refresh token received:', tokens.refresh_token);
  }
  console.log('✅ Access token refreshed successfully');
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const createEmployeeFolder = async (employeeName, parentId) => {
  const res = await drive.files.create({
    requestBody: {
      name: employeeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id'
  });
  return res.data.id;
};

const uploadToDrive = async (file, folderId) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  const res = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId]
    },
    media: {
      mimeType: file.mimetype,
      body: bufferStream
    },
    fields: 'id'
  });

  const fileId = res.data.id;

  await drive.permissions.create({
    fileId: fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  return `https://drive.google.com/uc?id=${fileId}`;
};



const getOrCreatePunchPhotosFolder = async () => {

  // ✅ Check if env has it set manually
  if (process.env.GOOGLE_PUNCH_PHOTOS_FOLDER_ID) {
    PUNCH_PHOTOS_FOLDER_ID = process.env.GOOGLE_PUNCH_PHOTOS_FOLDER_ID;
    return PUNCH_PHOTOS_FOLDER_ID;
  }

  // ✅ Create it inside root folder
  const createRes = await drive.files.create({
    requestBody: {
      name: 'Punch Photos',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    },
    fields: 'id'
  });

  PUNCH_PHOTOS_FOLDER_ID = createRes.data.id;
  return PUNCH_PHOTOS_FOLDER_ID;
};

// ✅ Updated uploadPunchPhoto
const uploadPunchPhoto = async (fileBuffer, employeeId, punchType) => {
  const moment = require('moment');

  const folderId = await getOrCreatePunchPhotosFolder();

  const timestamp  = moment().format('YYYY-MM-DD_HH-mm-ss');
  const safeName   = (employeeId).replace(/\s+/g, '_');
  const fileName   = `${punchType}_${safeName}_${timestamp}.jpg`;

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType: 'image/jpeg',
      body: bufferStream
    },
    fields: 'id'
  });

  const fileId = res.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
};

module.exports = {
  createEmployeeFolder,
  uploadToDrive,
  uploadPunchPhoto,
  getOrCreatePunchPhotosFolder  // ✅ export for startup call
};
