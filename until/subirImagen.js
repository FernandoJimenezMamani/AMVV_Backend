const { ref, getDownloadURL, uploadBytesResumable, deleteObject } = require('firebase/storage');
const { storage } = require('../config/firebase');
const sharp = require('sharp');

async function uploadFile(file, customFileName = null, previousFileRef = null, folder = 'FilesClubs') {
  try {
    // Procesar el archivo con sharp
    let fileBuffer = await sharp(file.buffer)
      .resize({ width: 200, height: 200, fit: 'cover' })
      .toBuffer();

    // Usar el nombre personalizado si se proporciona, de lo contrario, usar el original
    const fileName = customFileName ? `${customFileName}-${Date.now()}.jpeg` : `${file.originalname}-${Date.now()}`;

    // Referencia al archivo en Firebase Storage en la carpeta especificada
    const fileRef = ref(storage, `${folder}/${fileName}`);
    const fileMetadata = {
      contentType: file.mimetype,
    };

    // Subir el archivo
    const fileUploadPromise = uploadBytesResumable(fileRef, fileBuffer, fileMetadata);
    await fileUploadPromise;

    // Obtener la URL de descarga
    const fileDownloadURL = await getDownloadURL(fileRef);

    // Eliminar la imagen anterior si se proporciona
    if (previousFileRef) {
      await deleteObject(previousFileRef);
    }

    return { ref: fileRef, downloadURL: fileDownloadURL };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file.');
  }
}

module.exports = { uploadFile };