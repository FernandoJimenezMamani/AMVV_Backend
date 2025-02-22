const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

async function generatePDF(partidos, campeonatoNombre, fecha) {
  const templatePath = path.join(__dirname, '..', 'templates', 'partidoTemplate.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Convertir logo a Base64
  const logoPath = path.join(__dirname, '..', 'resources', 'images', 'logoAMVV.jpg');
  const logoBase64 = fs.readFileSync(logoPath, 'base64');
  const logoDataURI = `data:image/jpeg;base64,${logoBase64}`;

  // Generar contenido de partidos en HTML
  let partidosHTML = `<h2>Partidos para el ${fecha}</h2><div>`;
  const lugaresMap = new Map();

  partidos.forEach((p) => {
      if (!lugaresMap.has(p.lugar_nombre)) {
          lugaresMap.set(p.lugar_nombre, []);
      }
      lugaresMap.get(p.lugar_nombre).push(p);
  });

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
              <th>Árbitros</th>
            </tr>
          </thead>
          <tbody>
      `;
      partidosLugar.forEach((p, index) => {
        let fechaOriginal = moment(p.fecha);

        let fechaAjustada = fechaOriginal.add(4, 'hours');

        const horaPartido = fechaAjustada.format("HH:mm");
          partidosHTML += `
            <tr>
              <td>${index + 1}</td>
              <td>${horaPartido}</td>
              <td>${p.categoria_nombre}</td>
              <td>${p.equipo_local_nombre}</td>
              <td>VS</td>
              <td>${p.equipo_visitante_nombre}</td>
              <td>${p.arbitros || 'C.A.V.V.'}</td>
            </tr>
          `;
      });
      partidosHTML += `</tbody></table><br>`;
  });

  partidosHTML += '</div>';

  // Reemplazar variables en la plantilla
  template = template
                       .replace(/{{campeonato_nombre}}/g, campeonatoNombre)
                       .replace(/{{logo}}/g, logoDataURI)
                       .replace(/{{partidos}}/g, partidosHTML);

  const browser = await puppeteer.launch();
  try {
      const page = await browser.newPage();
      await page.setContent(template, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(__dirname, '..', 'pdf-generator', 'generated', `${campeonatoNombre}_${fecha}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A4' });

      return pdfPath;
  } catch (error) {
      console.error('Error generando PDF:', error);
  } finally {
      await browser.close();
  }
}

module.exports = generatePDF;
