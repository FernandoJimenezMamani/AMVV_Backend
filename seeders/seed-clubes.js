const { sequelize } = require('../models');
const { Club, ImagenClub,PersonaRol } = require('../models');

const seedClubs = async () => {
  let transaction;
  try {
    console.log('Iniciando la transacción...');
    transaction = await sequelize.transaction();

    // Lista de clubes
    const clubs = [
      { nombre: 'Lapkosmi', descripcion: 'Equipo de alto rendimiento.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Heroes del Chaco', descripcion: 'Equipo con tradición ganadora.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Camuesa', descripcion: 'Equipo con enfoque juvenil.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Bronco', descripcion: 'Equipo especializado en voleibol.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Salamanca', descripcion: 'Equipo femenino competitivo.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Santana', descripcion: 'Equipo con enfoque recreativo.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Estrellas', descripcion: 'Equipo con grandes promesas.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Toros', descripcion: 'Equipo con fuerte espíritu deportivo.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Club Los Dragones', descripcion: 'Equipo juvenil y dinámico.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Sirenas', descripcion: 'Equipo femenino con pasión por el deporte.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Club Los Guerreros', descripcion: 'Equipo con enfoque estratégico.', presidente_asignado: 'N', eliminado: 'N' },
      { nombre: 'Club Las Amazonas', descripcion: 'Equipo mixto con fuerte unión.', presidente_asignado: 'N', eliminado: 'N' },
    ];

    // Lista de imágenes asociadas a los clubes
    const images = [
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2Fblob-1735525948192?alt=media&token=f125b6ae-814c-42da-b65b-3b7dfa741102',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2FHeroes_del_Chaco_image-1728884124285.jpeg?alt=media&token=d7397a18-4b34-4742-ac7a-cd2dd99959ed',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2FCamuesa_image-1728884189667.jpeg?alt=media&token=a2b5e39b-5d2f-457d-87f5-29aff2e94140',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2FBronco_image-1728884457732.jpeg?alt=media&token=7029cf90-8779-4435-b056-1a11fa52da49',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2FBronco_image-1728884445576.jpeg?alt=media&token=191f19d4-b4cc-4d37-8ae0-b909e87495d7',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2FSalamanca_image-1728884561656.jpeg?alt=media&token=53189304-b62d-427d-93d8-ca6c94e9f57e',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2F_Norte%C3%B1os_image-1728884815284.jpeg?alt=media&token=1cf6171e-d8ea-4d31-97bd-c1a152146f42',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2FSantana_image-1728884842591.jpeg?alt=media&token=d378c88a-3591-4dfe-8cab-b87e1530d26f',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2Fprueba1_image-1735442478795.jpeg?alt=media&token=ac6bca07-0e4b-4318-bb7a-829209087d2f',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2Fprueba2_image-1735442670057.jpeg?alt=media&token=d5b80e1a-1a56-40e1-9852-5844b67e2aee',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2Fprueba_3_image-1735522140906.jpeg?alt=media&token=21c811f2-704c-4014-8b55-366cb5745e90',
      'https://firebasestorage.googleapis.com/v0/b/amvv-dbf.appspot.com/o/FilesClubs%2Fprueba_7_image-1736121403844.jpeg?alt=media&token=9bee2ad0-2ea1-4e49-893d-205389f012c1',
    ];

    const idPresidente = await PersonaRol.findOne({
      where: { rol_id: 1 },
      attributes: ['persona_id'],
      raw: true,
    });

    // Validación para asegurarse de que hay una imagen por cada club
    if (clubs.length !== images.length) {
      throw new Error('La cantidad de clubes y de imágenes no coincide.');
    }

    console.log('Insertando clubes y sus imágenes...');
    for (let i = 0; i < clubs.length; i++) {
      // Insertar el club en la tabla Club
      const newClub = await Club.create(
        {
          ...clubs[i],
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          user_id: idPresidente.persona_id
        },
        { transaction }
      );

      // Insertar la imagen correspondiente en la tabla ImagenClub
      await ImagenClub.create(
        {
          club_id: newClub.id, // Asociar con el ID del club recién creado
          club_imagen: images[i], // Imagen correspondiente
        },
        { transaction }
      );

      console.log(`Club ${newClub.nombre} y su imagen ${images[i]} insertados correctamente.`);
    }

    console.log('Confirmando la transacción...');
    await transaction.commit();
    console.log('Seed de clubes completado exitosamente con imágenes asociadas.');
  } catch (error) {
    console.error('Error durante el seed de clubes:', error);
    if (transaction) {
      console.log('Deshaciendo la transacción...');
      await transaction.rollback();
    }
  } finally {
    console.log('Cerrando la conexión a la base de datos...');
    await sequelize.close();
  }
};

seedClubs();
