const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { renderCertificatePNG } = require('./render_certificate');
const { notifyAdminOnDeploy, welcomeUser, notifyTeacher } = require('./notify');

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const USERS_FILE = path.join(DATA_DIR, 'users.json');
let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body || {};
  if(!username || !password || !email) return res.status(400).json({ error: 'missing fields' });
  if(users.find(u=>u.email===email)) return res.status(400).json({ error: 'user exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: users.length+1, username, email, passwordHash: hash };
  users.push(user);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  try { await welcomeUser(username, email); } catch(e){ console.error('welcome email failed', e); }
  res.json({ status: 'ok' });
});

app.post('/api/generate-certificate', async (req, res) => {
  const { name, score, total, email } = req.body || {};
  if(!name || !email) return res.status(400).json({ error: 'missing' });
  try {
    const certId = 'C' + Date.now();
    const pngBuffer = await renderCertificatePNG({ name, score, total, certId });
    const doc = new PDFDocument({ size:'A4', margin:50 });
    const bufs = [];
    doc.on('data', bufs.push.bind(bufs));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(bufs);
      // send email with attachments
      try{
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({ host: process.env.MAILGUN_SMTP_SERVER || 'smtp.mailgun.org', port: process.env.MAILGUN_SMTP_PORT ? parseInt(process.env.MAILGUN_SMTP_PORT) : 587, auth: { user: process.env.MAILGUN_SMTP_LOGIN, pass: process.env.MAILGUN_SMTP_PASSWORD } });
        const from = process.env.SMTP_FROM || `Fastpitch Quiz Team <${process.env.MAILGUN_SMTP_LOGIN}>`;
        const mailOptions = { from, to: email, subject: 'Your Certificate - Fastpitch Quiz', html: fs.existsSync(path.join(__dirname, '..', 'assets', 'email_templates', 'certificate.html')) ? fs.readFileSync(path.join(__dirname, '..', 'assets', 'email_templates', 'certificate.html'),'utf8').replace('{{username}}', name).replace('{{score}}', String(score)).replace('{{total}}', String(total)).replace('{{certId}}', certId).replace('{{certificateUrl}}', (process.env.FRONTEND_URL||'') + '/certificate/' + certId) : `<p>Your certificate</p>`, attachments: [{ filename: `${certId}.png`, content: pngBuffer }, { filename: `${certId}.pdf`, content: pdfData } ] };
        await transporter.sendMail(mailOptions);
      }catch(e){ console.error('sendMail failed', e); }
      // notify teacher
      const certUrl = (process.env.FRONTEND_URL||'') + '/certificate/' + certId;
      try { await notifyTeacher(name, email, certUrl); } catch(e){ console.error('notifyTeacher failed', e); }
      res.json({ status: 'ok', certId, certUrl });
    });    });
    doc.image(pngBuffer, { fit:[450,600], align:'center', valign:'center' });
    doc.end();
  } catch(err) {
    console.error(err);
    res.status(500).json({ error:'failed' });
  }
});

// notify admin on start (best-effort)
(async ()=>{ try{ await notifyAdminOnDeploy(); }catch(e){ console.error('admin notify failed', e); } })();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Server running on port', port));
