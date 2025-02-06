const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF(fecha, partidos) {
  const templatePath = path.join(__dirname, 'templates', 'partidoTemplate.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Asegurar ruta correcta del logo
  const logoPath = path.join(__dirname, '..', 'resources', 'images', 'logoAMVV.jpg');

  // Convertir imagen a Base64 para evitar problemas con file://
  const logoBase64 = fs.readFileSync(logoPath, 'base64');
  const logoDataURI = `data:image/jpeg;base64,${logoBase64}`;

  // Agrupar partidos por lugar
  const lugaresMap = new Map();
  partidos.forEach((p) => {
    if (!lugaresMap.has(p.lugar_nombre)) {
      lugaresMap.set(p.lugar_nombre, []);
    }
    lugaresMap.get(p.lugar_nombre).push(p);
  });

  // Generar HTML de partidos agrupados por lugar
  let partidosHTML = '';
  lugaresMap.forEach((partidosLugar, lugar) => {
    partidosHTML += `<h2>${lugar}</h2>`;
    partidosHTML += `
      <table border="1">
        <thead>
          <tr>
            <th>#</th>
            <th>Hora</th>
            <th>Categoría</th>
            <th>Equipo Local</th>
            <th></th>
            <th>Equipo Visitante</th>
            <th>Árbitro</th>
          </tr>
        </thead>
        <tbody>
    `;
    partidosLugar.forEach((p, index) => {
      partidosHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${p.hora_partido}</td>
          <td>${p.categoria_nombre}</td>
          <td>${p.equipolocal_nombre}</td>
          <td>VS</td>
          <td>${p.equipovisitante_nombre}</td>
          <td>${p.arbitro || 'C.A.V.V.'}</td>
        </tr>
      `;
    });
    partidosHTML += `</tbody></table><br>`;
  });

  // Reemplazar variables en la plantilla
  template = template.replace(/{{fecha}}/g, fecha)
                     .replace(/{{partidos}}/g, partidosHTML)
                     .replace(/{{logo}}/g, logoDataURI);

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(__dirname, 'generated', `${fecha}.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4' });

    return pdfPath;
  } catch (error) {
    console.error('Error generando PDF:', error);
  } finally {
    await browser.close();
  }
}

module.exports = generatePDF;
