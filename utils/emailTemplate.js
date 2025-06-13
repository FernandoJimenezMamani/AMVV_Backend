const fs = require('fs');
const path = require('path');

/**
 * Carga una plantilla de correo desde un archivo HTML y reemplaza los valores dinámicos
 * @param {string} templateName - Nombre del archivo de la plantilla (sin extensión)
 * @param {Object} replacements - Objeto con los valores a reemplazar en la plantilla
 * @returns {string} - HTML de la plantilla con los valores reemplazados
 */
const loadEmailTemplate = (templateName, replacements) => {
  try {
    // Ruta de la plantilla
    const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar las variables en la plantilla con los valores proporcionados
    for (const key in replacements) {
      const regex = new RegExp(`{{${key}}}`, 'g'); // Expresión regular para reemplazo global
      template = template.replace(regex, replacements[key]);
    }

    return template;
  } catch (error) {
    console.error(`❌ Error al cargar la plantilla de correo ${templateName}:`, error);
    return ''; // Retorna cadena vacía si hay error
  }
};

module.exports = { loadEmailTemplate };
