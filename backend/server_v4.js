import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import nodemailer from "nodemailer";
import { generateCertificate } from "./render_certificate.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors({
  origin: ["https://fastpitch-quiz-frontend.onrender.com", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Fastpitch Quiz Backend is running 🚀");
});

// ✅ POST: send certificate email + save record
app.post("/send-certificate", async (req, res) => {
  try {
    const { name, email, quizTitle, score } = req.body;

    console.log(`Generating certificate for ${name} (${email})`);

    // Generate the certificate PDF
    const certPath = await generateCertificate(name, score, quizTitle);

    // Save certificate record
    const certData = {
      name,
      email,
      quizTitle,
      score,
      issuedAt: new Date().toISOString(),
    };

    const filePath = path.join(process.cwd(), "certificates.json");
    let existing = [];

    try {
      existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      existing = [];
    }

    existing.push(certData);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    // Email transport setup
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ HTML Email Template
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f7; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #002366; color: white; text-align: center; padding: 20px;">
            <img src="https://i.ibb.co/T2cv6gP/Energetic-Fastpitch-Softball-Logo.png" alt="Fastpitch Logo" width="100" style="border-radius: 50%;" />
            <h2 style="margin-top: 10px;">Men’s Fastpitch Quiz</h2>
          </div>
          <div style="padding: 25px; text-align: center; color: #333;">
            <h3 style="color: #C8102E;">Congratulations, ${name}!</h3>
            <p>You have successfully completed the quiz:</p>
            <h2 style="color: #002366;">"${quizTitle}"</h2>
            <p>Your Score: <strong>${score}%</strong></p>
            <p style="margin-top: 15px;">Attached below is your official certificate of achievement.</p>
          </div>
          <div style="background-color: #f0f0f0; color:#555; text-align:center; padding:10px; font-size: 12px;">
            © ${new Date().getFullYear()} Men’s Fastpitch Quiz | fastpitch-quiz.onrender.com
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Men’s Fastpitch Quiz" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Your Fastpitch Quiz Certificate",
      html: htmlTemplate,
      attachments: [
        {
          filename: `${name.replace(/\s+/g, "_")}_certificate.pdf`,
          path: certPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Certificate sent to ${email}`);

    res.status(200).json({ message: "Certificate sent and recorded successfully!" });
  } catch (error) {
    console.error("Error sending certificate:", error);
    res.status(500).json({ message: "Error sending certificate", error: error.message });
  }
});

// ✅ POST: Verify certificate authenticity
app.post("/verify-certificate", (req, res) => {
  try {
    const { name, email } = req.body;

    console.log(`Verifying certificate for ${name} (${email})`);

    const filePath = path.join(process.cwd(), "certificates.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ verified: false, message: "No certificates found." });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const match = data.find(
      (cert) =>
        cert.name.toLowerCase() === name.toLowerCase() &&
        cert.email.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      res.status(200).json({
        verified: true,
        message: `✅ Verified certificate for ${match.name} (${match.quizTitle}, Score: ${match.score}%)`,
        data: match,
      });
    } else {
      res.status(404).json({
        verified: false,
        message: "❌ Certificate not found. Please check your name and email.",
      });
    }
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ message: "Error verifying certificate" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
