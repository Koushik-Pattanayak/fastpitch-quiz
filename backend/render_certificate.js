import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export async function generateCertificate(userName, quizScore, quizTitle) {
  const certPath = `/tmp/${userName.replace(/\s+/g, "_")}_certificate.pdf`;
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, left: 60, right: 60, bottom: 60 },
  });

  const logoPath = path.resolve("./Energetic Fastpitch Softball Logo.png");

  const writeStream = fs.createWriteStream(certPath);
  doc.pipe(writeStream);

  // Colors from logo
  const primaryColor = "#002366"; // navy blue
  const accentColor = "#C8102E"; // red
  const textGray = "#333333";

  // Background and header/footer
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");
  doc.fillColor(primaryColor).rect(0, 0, doc.page.width, 15).fill(primaryColor);
  doc.fillColor(accentColor).rect(0, doc.page.height - 15, doc.page.width, 15).fill(accentColor);

  // Logo
  try {
    doc.image(logoPath, doc.page.width / 2 - 60, 70, { width: 120 });
  } catch (err) {
    console.error("Logo missing, skipped image.");
  }

  // Title
  doc.moveDown(3);
  doc.fontSize(26).fillColor(primaryColor).font("Helvetica-Bold")
    .text("Certificate of Achievement", { align: "center", lineGap: 8 });

  doc.moveDown(1);
  doc.fontSize(14).fillColor(textGray).font("Helvetica")
    .text("This is to certify that", { align: "center" });

  doc.moveDown(0.5);
  doc.fontSize(22).fillColor(primaryColor).font("Helvetica-Bold")
    .text(userName, { align: "center" });

  doc.moveDown(0.5);
  doc.fontSize(14).fillColor(textGray).font("Helvetica")
    .text("has successfully completed the quiz", { align: "center" });

  doc.moveDown(0.5);
  doc.fontSize(18).fillColor(accentColor).font("Helvetica-Bold")
    .text(`"${quizTitle}"`, { align: "center" });

  doc.moveDown(1);
  doc.fontSize(14).fillColor(textGray).font("Helvetica")
    .text("with a score of", { align: "center" });

  doc.moveDown(0.5);
  doc.fontSize(22).fillColor(primaryColor).font("Helvetica-Bold")
    .text(`${quizScore}%`, { align: "center" });

  doc.moveDown(1.5);
  doc.fontSize(12).fillColor(textGray).font("Helvetica-Oblique")
    .text("Issued by the Men's Fastpitch Quiz Platform", { align: "center" });

  // Footer line
  doc.moveDown(2);
  doc.fontSize(10).fillColor(accentColor).font("Helvetica")
    .text("fastpitch-quiz.onrender.com", { align: "center" });

  doc.end();

  await new Promise((resolve) => writeStream.on("finish", resolve));
  return certPath;
}
