const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_SERVER || 'smtp.mailgun.org',
    port: process.env.MAILGUN_SMTP_PORT ? parseInt(process.env.MAILGUN_SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.MAILGUN_SMTP_LOGIN,
      pass: process.env.MAILGUN_SMTP_PASSWORD
    }
  });
}

async function sendMail(options) {
  const transporter = createTransporter();
  return transporter.sendMail(options);
}

async function notifyAdminOnDeploy() {
  if(!process.env.ADMIN_EMAIL) return;
  const from = process.env.SMTP_FROM || `Fastpitch Quiz Team <${process.env.MAILGUN_SMTP_LOGIN}>`;
  await sendMail({ from, to: process.env.ADMIN_EMAIL, subject: '✅ Fastpitch Quiz Deployment Complete', text: 'Deployment finished and DB seeded.' });
}

async function welcomeUser(username, userEmail) {
  if(!userEmail) return;
  const from = process.env.SMTP_FROM || `Fastpitch Quiz Team <${process.env.MAILGUN_SMTP_LOGIN}>`;
  const fs = require('fs');
  const path = require('path');
  const templatePath = path.join(__dirname, '..', 'assets', 'email_templates', 'registration.html');
  let html = fs.existsSync(templatePath) ? fs.readFileSync(templatePath,'utf8') : `<p>Welcome, ${username}</p>`;
  html = html.replace('{{username}}', username || 'Participant').replace('{{quizUrl}}', process.env.FRONTEND_URL || '');
  await sendMail({ from, to: userEmail, subject: 'Welcome to Fastpitch Quiz', html });
}

async function notifyTeacher(studentName, studentEmail, certificateUrl) {
  if(!process.env.TEACHER_EMAIL) return;
  const from = process.env.SMTP_FROM || `Fastpitch Quiz Team <${process.env.MAILGUN_SMTP_LOGIN}>`;
  const html = `<p><b>${studentName}</b> (${studentEmail}) earned a certificate. <a href="${certificateUrl}">View certificate</a></p>`;
  await sendMail({ from, to: process.env.TEACHER_EMAIL, subject: `🎓 ${studentName} earned a certificate`, html });
}

module.exports = { notifyAdminOnDeploy, welcomeUser, notifyTeacher };
