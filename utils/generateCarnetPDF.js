const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const logoImagen = path.join(__dirname, '..', 'resources','images' ,  'logo.png');

async function generateCarnetPDF({ nombre, apellido, fecha_nacimiento, ci, imagenURL, clubNombre, categoriaNombre,equipoNombre, id }) {
  const templatePath = path.join(__dirname, '..', 'templates', 'carnetJugadorTemplate.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  const logoBase64 = fs.readFileSync(logoImagen, 'base64');
  const logoDataURI = `data:image/png;base64,${logoBase64}`;


  // Reemplazar en la plantilla
  template = template
    .replace(/{{logo}}/g, logoDataURI)
    .replace(/{{foto}}/g, imagenURL)
    .replace(/{{nombre_completo}}/g, `${nombre} ${apellido}`)
    .replace(/{{ci}}/g, ci)
    .replace(/{{fecha_nacimiento}}/g, moment(fecha_nacimiento).format('YYYY-MM-DD'))
    .replace(/{{club}}/g, clubNombre)
    .replace(/{{categoria}}/g, categoriaNombre)
    .replace(/{{equipo}}/g, equipoNombre)
    .replace(/{{anio}}/g, new Date().getFullYear());

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(__dirname, '..', 'pdf-generator', 'generated', `Carnet_${id}.pdf`);
    await page.pdf({
      path: pdfPath,
      width: '350px',
      height: '200px',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });
    

    return pdfPath;
  } catch (error) {
    console.error('Error generando carnet:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = generateCarnetPDF;
