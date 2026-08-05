require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const creds = require('./config/oauth-credentials.json');

const oauth2Client = new google.auth.OAuth2(
  creds.installed.client_id,
  creds.installed.client_secret,
  'http://localhost'   // ✅ changed from oob
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
});

console.log('\n👉 Open this URL in browser:\n', authUrl);
console.log('\nAfter signing in, you will be redirected to localhost (will fail to load)');
console.log('Copy the ENTIRE URL from your browser address bar and paste below\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the full redirect URL here: ', async (url) => {
  // Extract code from the URL
  const code = new URL(url).searchParams.get('code');
  
  const { tokens } = await oauth2Client.getToken(code);
  console.log('\n✅ REFRESH TOKEN:', tokens.refresh_token);
  console.log('\nCopy this to your .env as GOOGLE_REFRESH_TOKEN');
  rl.close();
});