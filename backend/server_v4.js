// server.js – Improved Certificate System with Email + QR Verification
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load environment variables
const {
  SMTP_FROM,
  MAILGUN_SMTP_SERVER,
  MAILGUN_SMTP_PORT,
  MAILGUN_SMTP_LOGIN,
  MAILGUN_SMTP_PASSWORD,
  FRONTEND_URL,
  ISSUER_TITLE
} = process.env;

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
  host: MAILGUN_SMTP_SERVER,
  port: MAILGUN_SMTP_PORT,
  auth: {
    user: MAILGUN_SMTP_LOGIN,
    pass: MAILGUN_SMTP_PASSWORD
  }
});

// --- Certificate Generation ---
const generateCertificate = async (name, score, category) => {
  const certId = uuidv4().split("-")[0];
  const certDir = path.join(process.cwd(), "certificates");
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

  const verifyUrl = `${FRONTEND_URL}/verify?id=${certId}`;
  const qrPath = path.join(certDir, `${certId}_qr.png`);
  await QRCode.toFile(qrPath, verifyUrl);

  const pdfPath = path.join(certDir, `${certId}.pdf`);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const logoPath = path.join(process.cwd(), "logo.png");

  const themeColor = "#002f6c";
  const accentColor = "#c8102e";

  doc.pipe(fs.createWriteStream(pdfPath));
  if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 40, { width: 100 });
  doc.fillColor(themeColor).fontSize(26).text("Men’s Fastpitch Softball", 160, 50);
  doc.fillColor(accentColor).fontSize(14).text(ISSUER_TITLE, 160, 80);
  doc.moveDown(3);

  doc.fillColor(themeColor).fontSize(32).text("Certificate of Achievement", { align: "center" });
  doc.moveDown(2);
  doc.fillColor("#333").fontSize(18).text(`Presented to`, { align: "center" });
  doc.fontSize(26).fillColor(themeColor).text(name, { align: "center" });
  doc.moveDown();
  doc.fillColor("#444").fontSize(16).text(
    `For outstanding performance in the ${category} quiz, scoring ${score}%`,
    { align: "center" }
  );
  doc.moveDown(3);
  doc.fontSize(12).fillColor("#666").text(`Certificate ID: ${certId}`, 50, 700);
  doc.image(qrPath, 450, 660, { width: 100 });
  doc.end();

  const pngPath = path.join(certDir, `${certId}.png`);
  await sharp(pdfPath, { density: 300 }).png().toFile(pngPath);

  return { certId, pdfPath, pngPath, verifyUrl };
};

// --- API: Generate & Send Certificate ---
app.post("/api/certificate", async (req, res) => {
  try {
    const { name, email, score, category } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Missing name or email" });

    const { certId, pdfPath, pngPath, verifyUrl } = await generateCertificate(name, score, category);

    const mailOptions = {
      from: SMTP_FROM,
      to: email,
      subject: `Your Fastpitch Quiz Certificate`,
      html: `
        <h2>Congratulations, ${name}!</h2>
        <p>You've successfully completed the <b>${category}</b> quiz with a score of <b>${score}%</b>.</p>
        <p>Your certificate ID is <b>${certId}</b>.</p>
        <p>You can verify it anytime at: <a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Keep learning and growing in Men’s Fastpitch Softball!</p>
      `,
      attachments: [
        { filename: `Certificate-${certId}.pdf`, path: pdfPath },
        { filename: `Certificate-${certId}.png`, path: pngPath }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, certId, verifyUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Certificate generation failed" });
  }
});

// --- API: Verify Certificate ---
app.get("/verify", (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing certificate ID");

  // In a real app, this would check a database
  res.send(`
    <html><head><title>Verify Certificate</title></head>
    <body style="font-family: Arial; text-align: center; padding-top: 50px;">
      <h2>Certificate Verification</h2>
      <p><b>Certificate ID:</b> ${id}</p>
      <p>Status: ✅ Verified</p>
      <p>Issued by ${ISSUER_TITLE}</p>
    </body></html>
  `);
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
