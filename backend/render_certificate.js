const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

async function renderCertificatePNG({ name, score, total, certId }) {
  const svgPath = path.join(__dirname, '..', 'assets', 'certificate-template.svg');
  let svg = fs.existsSync(svgPath) ? fs.readFileSync(svgPath, 'utf8') : `<svg xmlns='http://www.w3.org/2000/svg'><text x='10' y='20'>Certificate</text></svg>`;
  svg = svg.replace('[Participant Name]', name || 'Participant')
           .replace('[SCORE]', String(score || '0'))
           .replace('[TOTAL]', String(total || '0'))
           .replace('[CERTID]', certId || uuidv4().slice(0,8))
           .replace('[ISSUER]', process.env.CERTIFICATE_ISSUER || '');
  const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
  return pngBuffer;
}

module.exports = { renderCertificatePNG };
