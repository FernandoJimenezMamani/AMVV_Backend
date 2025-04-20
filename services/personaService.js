const { Persona, Usuario, ImagenPersona, PersonaRol, Rol ,Sequelize, Arbitro,PresidenteClub ,Jugador,Club} = require('../models');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const sequelize = require('../config/sequelize');
const { uploadFile } = require('../utils/subirImagen');
const { ref, deleteObject } = require('firebase/storage');
const { storage } = require('../config/firebase');
const roleNames = require('../constants/roles')
const { Op, where } = require('sequelize');
const { sendEmail } = require('./emailService');
const { generatePassword } = require('../utils/passwordHelper'); 
const { sendBienvenidaUsuarioEmail } = require('./sendEmailTraspaso');


exports.getAllPersonas = async () => {
  const personas = await sequelize.query(`
    SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.genero AS genero_persona,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo,
		    STRING_AGG(Rol.nombre, ', ') AS roles
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
      iNNER JOIN PersonaRol ON Persona.id = PersonaRol.persona_id
      INNER JOIN Rol ON Rol.id= PersonaRol.rol_id AND PersonaRol.eliminado = 0
      LEFT JOIN PresidenteClub ON PresidenteClub.id = Persona.id
      GROUP BY Persona.id,
              Persona.nombre,
              Persona.apellido,
              Persona.fecha_nacimiento,
              Persona.ci,
              Persona.genero,
              Persona.direccion,
              Persona.fecha_registro,
              Persona.fecha_actualizacion,
              Persona.eliminado,
              ImagenPersona.persona_imagen,
              Usuario.correo;
  `, { type: sequelize.QueryTypes.SELECT });
  return personas;
};

exports.emailExists = async (correo) => {
  try {
    const usuario = await Usuario.findOne({
      where: { correo }
    });

    return !!usuario; 
  } catch (error) {
    console.error('Error al verificar si el correo existe:', error);
    throw new Error('Error al verificar si el correo existe');
  }
};

exports.emailExistsUpdate = async (correo, personaId = null) => {
  try {
    const whereClause = {
      correo
    };

    if (personaId) {
      whereClause.id = { [Sequelize.Op.ne]: personaId }; // Excluir el usuario actual
    }

    const usuario = await Usuario.findOne({
      where: whereClause
    });

    return !!usuario; // Retorna true si encuentra otro usuario con el mismo correo
  } catch (error) {
    console.error('Error al verificar si el correo existe:', error);
    throw new Error('Error al verificar si el correo existe');
  }
};


exports.getPersonaById = async (id) => {
  try {
    const personas = await sequelize.query(`
       SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        CONVERT(VARCHAR(10), Persona.fecha_nacimiento, 120) AS fecha_nacimiento,
        Persona.ci,
        Persona.genero,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo,
        STRING_AGG(Rol.nombre, ', ') AS roles,
        PresidenteClub.club_id as 'club_presidente',
        Jugador.club_id as 'club_jugador'
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
      iNNER JOIN PersonaRol ON Persona.id = PersonaRol.persona_id
      INNER JOIN Rol ON Rol.id= PersonaRol.rol_id AND PersonaRol.eliminado = 0
      LEFT JOIN Jugador ON Persona.id =Jugador.jugador_id AND Jugador.activo = 1
   LEFT JOIN PresidenteClub ON Persona.id = PresidenteClub.presidente_id AND PresidenteClub.activo = 1
      WHERE
        Persona.id = :id AND Persona.eliminado = 'N'
		        GROUP BY Persona.id,
            Persona.nombre,
            Persona.apellido,
            Persona.fecha_nacimiento,
            Persona.ci,
			      Persona.genero,
            Persona.direccion,
            Persona.fecha_registro,
            Persona.fecha_actualizacion,
            Persona.eliminado,
            ImagenPersona.persona_imagen,
            Usuario.correo,
            Jugador.club_id,
			      PresidenteClub.club_id;
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    const persona = personas[0];

    return persona;
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};

const getRolId = async (roleName) =>{
  const roleObtained = await Rol.findOne({
    where : {nombre : roleName}
  });
  if (!roleObtained) {
    throw new Error(`El rol "${roleName}" no se encontró en la base de datos.`);
  }
  return roleObtained.id
}

// Función para verificar roles duplicados
exports.checkDuplicateRoles = async (roles) => {
  if (roles.includes(roleNames.Tesorero)) {
    const existingTesorero = await PersonaRol.findOne({
      where: { rol_id: await getRolId(roleNames.Tesorero), eliminado: 0 }
    });
    if (existingTesorero) {
      throw new Error('Ya existe un usuario con el rol de Tesorero activo.');
    }
  }

  if (roles.includes(roleNames.PresidenteArbitro)) {
    const existingPresidenteArbitro = await PersonaRol.findOne({
      where: { rol_id: await getRolId(roleNames.PresidenteArbitro), eliminado: 0 }
    });
    if (existingPresidenteArbitro) {
      throw new Error('Ya existe un usuario con el rol de Presidente de Árbitros activo.');
    }
  }
};

exports.createPersonaWithRoles = async (data, imagen, roles, clubes) => {
  console.time('🟢 TOTAL TIEMPO TOTAL DEL SERVICIO');

  const { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo } = data;
  const { club_jugador_id, club_presidente_id, club_delegado_id } = clubes;

  console.time('⏳ Generación de contraseña');
  const generatedPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);
  console.timeEnd('⏳ Generación de contraseña');

  console.time('⏳ Subida de imagen');
  const uploadResult = imagen
    ? await uploadFile(imagen, `${nombre}_${apellido}_image`, null, 'FilesPersonas')
    : null;
  const downloadURL = uploadResult ? uploadResult.downloadURL : null;
  console.timeEnd('⏳ Subida de imagen');

  const transaction = await Persona.sequelize.transaction();

  try {
    console.time('⏳ Creación de Persona + Usuario');
    const nuevaPersona = await Persona.create({
      nombre,
      apellido,
      fecha_nacimiento,
      ci,
      direccion,
      genero,
      fecha_registro: Sequelize.fn('GETDATE'),
      fecha_actualizacion: Sequelize.fn('GETDATE'),
      eliminado: 'N'
    }, { transaction });

    const nuevoUsuario = await Usuario.create({
      id: nuevaPersona.id,
      contraseña: hashedPassword,
      correo
    }, { transaction });

    nuevaPersona.user_id = nuevoUsuario.id;
    await nuevaPersona.save({ transaction });
    console.timeEnd('⏳ Creación de Persona + Usuario');

    console.time('⏳ Asignación de roles');
    for (const rol of roles) {
      const rolId = await getRolId(rol);

      await PersonaRol.create({
        persona_id: nuevaPersona.id,
        rol_id: rolId,
        eliminado: 0
      }, { transaction });

      switch (rol) {
        case roleNames.Jugador:
          await Jugador.create({
            jugador_id: nuevaPersona.id,
            club_id: club_jugador_id,
            activo: 1
          }, { transaction });
          break;

        case roleNames.PresidenteClub:
          await PresidenteClub.create({
            presidente_id: nuevaPersona.id,
            club_id: club_presidente_id,
            activo: 1,
            delegado: 'N'
          }, { transaction });

          await Club.update(
            { presidente_asignado: 'S' },
            { where: { id: club_presidente_id }, transaction }
          );
          break;

        case roleNames.DelegadoClub:
          await PresidenteClub.create({
            presidente_id: nuevaPersona.id,
            club_id: club_delegado_id,
            activo: 1,
            delegado: 'S'
          }, { transaction });
          break;

        case roleNames.Arbitro:
          await Arbitro.create({
            id: nuevaPersona.id,
            activo: 1
          }, { transaction });
          break;

        // Otros casos...
      }
    }
    console.timeEnd('⏳ Asignación de roles');

    console.time('⏳ Guardar imagen en DB');
    if (imagen) {
      await ImagenPersona.create({
        persona_id: nuevaPersona.id,
        persona_imagen: downloadURL
      }, { transaction });
    }
    console.timeEnd('⏳ Guardar imagen en DB');

    await transaction.commit();

    console.timeEnd('🟢 TOTAL TIEMPO TOTAL DEL SERVICIO');

    setImmediate(() => {
      sendBienvenidaUsuarioEmail(correo, nombre, generatedPassword)
        .catch(err => console.error(`❌ Error al enviar correo de bienvenida:`, err.message));
    });

    return nuevaPersona;

  } catch (error) {
    await transaction.rollback();
    console.error('Error durante la creación de persona con roles:', error);
    throw error;
  }
};

exports.updatePersonaWithRoles = async (id, data, imagen, roles, clubes) => {
  const { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo } = data;
  const { club_jugador_id, club_presidente_id ,club_delegado_id} = clubes;
  const transaction = await Persona.sequelize.transaction();

  try {
    await Persona.update({
      nombre,
      apellido,
      fecha_nacimiento,
      ci,
      direccion,
      genero,
      fecha_actualizacion: Sequelize.fn('GETDATE')
    }, {
      where: { id },
      transaction
    });

    await Usuario.update({ correo }, { where: { id }, transaction });
    const rolesActuales = await PersonaRol.findAll({
      where: { persona_id: id },
      transaction
    });
    console.log('Roles actuales obtenidos:', rolesActuales);

    const rolesActualesIDs = rolesActuales.map((r) => r.rol_id);
    const rolesIDs = await Promise.all(roles.map(async (role) => await getRolId(role)));

    const jugadorRolId = await getRolId(roleNames.Jugador);
    const PresidenteClubId = await getRolId(roleNames.PresidenteClub);
    const ArbitroId = await getRolId(roleNames.Arbitro);
    const DelegadoClubId = await getRolId(roleNames.DelegadoClub);
    const PresidenteArbitroId = await getRolId(roleNames.PresidenteArbitro);
    const TesoreroId = await getRolId(roleNames.Tesorero);
    for (const rol of roles) {
      const rolId = await getRolId(rol); // Obtener ID del rol actual
      const rolExistente = await PersonaRol.findOne({
        where: { persona_id: id, rol_id: rolId },
        transaction,
      });

      console.log(`Evaluando rol: ${rol}, ID del rol: ${rolId}`, rolExistente);

      if (rolExistente) {
        if (rolExistente.eliminado === 1) {
          console.log(`Reactivando rol ${rol} para persona con ID: ${id}`);
          await rolExistente.update({ eliminado: 0 }, { transaction });
        } else {
          console.log(`El rol ${rol} ya está activo para persona con ID: ${id}`);
        }
      } else {
        console.log(`Creando nueva relación para el rol ${rol} con ID: ${rolId}`);
        await PersonaRol.create({ persona_id: id, rol_id: rolId, eliminado: 0 }, { transaction });
      }
      switch (rol) {
        case roleNames.Jugador:
          await Jugador.update(
            { activo: 0 },
            {
              where: {
                jugador_id: id,
                club_id: { [Op.ne]: club_jugador_id }, // Todos los clubes excepto el actual
              },
              transaction,
            }
          );
            const jugadorExistente = await Jugador.findOne({
              where: { jugador_id: id, club_id: club_jugador_id },
              transaction,
            });
            console.log(`Validando jugador existente para ID: ${id}, Club ID: ${club_jugador_id}`, jugadorExistente);
            if (jugadorExistente) {
              console.log(`Reactivando jugador existente para ID: ${id}, Club ID: ${club_jugador_id}`);
              await jugadorExistente.update({ activo: 1 }, { transaction });
            } else {
              console.log(`Creando nueva relación de jugador para ID: ${id}, Club ID: ${club_jugador_id}`);
              await Jugador.create({
                jugador_id: id,
                club_id: club_jugador_id,
                activo: 1,
              }, { transaction });
            }
            await PersonaRol.upsert({ persona_id: id, rol_id: jugadorRolId, eliminado: 0 }, { transaction });
        break;

        case roleNames.PresidenteClub:
          // Desactivar relaciones anteriores del presidente en PresidenteClub
          console.log(`Desactivando relaciones previas del presidente con ID: ${id}`);
          await PresidenteClub.update(
            { activo: 0 }, // Desactiva todas las relaciones previas
            { where: { presidente_id: id }, transaction }
          );

          // Actualizar todos los clubes anteriores a presidente_asignado = 'N'
          console.log(`Actualizando estado de clubes anteriores para presidente ID: ${id}`);
          await Club.update(
            { presidente_asignado: 'N' },
            {
              where: { id: { [Sequelize.Op.in]: Sequelize.literal(
                `(SELECT club_id FROM PresidenteClub WHERE presidente_id = ${id})`
              ) } },
              transaction,
            }
          );

          // Buscar el nuevo club al que se asignará el presidente
          const clubPresidente = await Club.findOne({
            where: { id: club_presidente_id },
            transaction,
          });

          if (!clubPresidente) {
            throw new Error(`El club con ID: ${club_presidente_id} no existe.`);
          }

          console.log(`Creando o activando nueva relación para presidente con ID: ${id}, Club ID: ${club_presidente_id}`);
          const presidenteExistente = await PresidenteClub.findOne({
            where: { presidente_id: id, club_id: club_presidente_id },
            transaction,
          });

          if (presidenteExistente) {
            console.log(`Reactivando presidente existente en el club con ID: ${club_presidente_id}`);
            await presidenteExistente.update({ activo: 1, delegado: 'N' }, { transaction });
          } else {
            console.log(`Creando nueva relación de presidente para el club con ID: ${club_presidente_id}`);
            await PresidenteClub.create(
              {
                presidente_id: id,
                club_id: club_presidente_id,
                activo: 1,
                delegado: 'N',
              },
              { transaction }
            );
          }

          // Actualizar el nuevo club a presidente_asignado = 'S'
          console.log(`Actualizando club con ID: ${club_presidente_id} a presidente_asignado = 'S'`);
          await clubPresidente.update({ presidente_asignado: 'S' }, { transaction });

          // Asegurar que el rol de presidente se registre o actualice en PersonaRol
          await PersonaRol.upsert({ persona_id: id, rol_id: PresidenteClubId, eliminado: 0 }, { transaction });
          break;


          case roleNames.DelegadoClub:
              const delegadoExistente = await PresidenteClub.findOne({
                where: { presidente_id: id, club_id: club_delegado_id, delegado: 'S' },
                transaction,
              });
  
              if (delegadoExistente) {
                console.log(`Reactivando delegado con ID: ${id}`);
                await delegadoExistente.update({ activo: 1 }, { transaction });
              } else {
                console.log(`Creando relación para el rol de DelegadoClub con ID: ${id}`);
                await PresidenteClub.create({
                  presidente_id: id,
                  club_id: club_delegado_id,
                  activo: 1,
                  delegado: 'S',
                }, { transaction });
              }
              await PersonaRol.upsert({ persona_id: id, rol_id: DelegadoClubId, eliminado: 0 }, { transaction });
          break;

        case roleNames.Arbitro: // Árbitro
            const arbitroExistente = await PersonaRol.findOne({
              where: { persona_id: id, rol_id: ArbitroId },
              transaction,
            });
            if (arbitroExistente) {
              if (arbitroExistente.eliminado === 1) {
                console.log(`Reactivando relación de Árbitro para persona con ID: ${id}`);
                await arbitroExistente.update({ eliminado: 0 }, { transaction });
              } else {
                console.log(`El rol de Árbitro ya está activo para persona con ID: ${id}`);
              }
            } else {
              console.log(`Creando nueva relación para el rol de Árbitro con ID: ${id}`);
              await PersonaRol.create({ persona_id: id, rol_id: ArbitroId, eliminado: 0 }, { transaction });
            }
          
            console.log(`Actualizando/Insertando registro en la tabla Árbitro para persona con ID: ${id}`);
            await Arbitro.upsert({ id, activo: 1 }, { transaction });
            break;
            case roleNames.Tesorero:
              const tesoreroExistente = await PersonaRol.findOne({
                where: { persona_id: id, rol_id: TesoreroId },
                transaction,
              });
            
              if (tesoreroExistente) {
                if (tesoreroExistente.eliminado === 1) {
                  console.log(`Reactivando relación de Tesorero para persona con ID: ${id}`);
                  await tesoreroExistente.update({ eliminado: 0 }, { transaction });
                } else {
                  console.log(`El rol de Tesorero ya está activo para persona con ID: ${id}`);
                }
              } else {
                console.log(`Creando nueva relación para el rol de Tesorero con ID: ${id}`);
                await PersonaRol.create({ persona_id: id, rol_id: TesoreroId, eliminado: 0 }, { transaction });
              }
              break;

              case roleNames.PresidenteArbitro:
                const presidenteArbitroExistente = await PersonaRol.findOne({
                  where: { persona_id: id, rol_id: PresidenteArbitroId },
                  transaction,
                });
              
                if (presidenteArbitroExistente) {
                  if (presidenteArbitroExistente.eliminado === 1) {
                    console.log(`Reactivando relación de Presidente de Árbitros para persona con ID: ${id}`);
                    await presidenteArbitroExistente.update({ eliminado: 0 }, { transaction });
                  } else {
                    console.log(`El rol de Presidente de Árbitros ya está activo para persona con ID: ${id}`);
                  }
                } else {
                  console.log(`Creando nueva relación para el rol de Presidente de Árbitros con ID: ${id}`);
                  await PersonaRol.create({ persona_id: id, rol_id: PresidenteArbitroId, eliminado: 0 }, { transaction });
                }
                break;
        default:
          console.warn(`Rol desconocido con ID: ${rol}`);
      }
    }

    console.log('Eliminando roles que ya no están en la nueva lista...');
    for (const rol of rolesActualesIDs) {
      console.log(`Procesando rol actual: ${rol}`);
    
      if (!rolesIDs.includes(rol)) {
        console.log(`El rol ${rol} no está en la nueva lista de roles. Marcando como eliminado...`);
    
        // Actualizar PersonaRol para marcar como eliminado
        await PersonaRol.update(
          { eliminado: 1 }, // Marcado lógico de eliminación
          { where: { persona_id: id, rol_id: rol }, transaction }
        );
    
        switch (rol) {
          case await getRolId(roleNames.Jugador):
            console.log(`Marcando relación de Jugador como eliminada para persona con ID: ${id}`);
            await Jugador.update(
              { activo: 0 }, // Marcado lógico para el rol de Jugador
              { where: { jugador_id: id }, transaction }
            );
            break;
    
          case await getRolId(roleNames.PresidenteClub):
            console.log(`Marcando relación de PresidenteClub como eliminada para persona con ID: ${id}`);
            await PresidenteClub.update(
              { activo: 0 }, // Marcado lógico para el rol de PresidenteClub
              { where: { presidente_id: id, delegado: 'N' }, transaction }
            );
            console.log(`Actualizando presidente_asignado en Club para ID de club: ${club_presidente_id}`);
            await Club.update(
              { presidente_asignado: 'N' },
              { where: { id: club_presidente_id }, transaction }
            );
            break;
    
          case await getRolId(roleNames.DelegadoClub):
            console.log(`Marcando relación de DelegadoClub como eliminada para persona con ID: ${id}`);
            await PresidenteClub.update(
              { activo: 0 }, // Marcado lógico para DelegadoClub
              { where: { presidente_id: id, delegado: 'S' }, transaction }
            );
            console.log(`Actualizando presidente_asignado en Club para ID de club: ${club_presidente_id}`);
            await Club.update(
              { presidente_asignado: 'N' },
              { where: { id: club_delegado_id }, transaction }
            );
            break;
    
          case await getRolId(roleNames.Arbitro):
            console.log(`Marcando relación de Árbitro como eliminada para persona con ID: ${id}`);
            await Arbitro.update(
              { activo: 0 }, // Marcado lógico para Árbitro
              { where: { id }, transaction }
            );
            break;
    
          default:
            console.warn(`Rol desconocido no procesado: ${rol}`);
        }
      } else {
        console.log(`El rol ${rol} está presente en la nueva lista de roles. No se elimina.`);
      }
    }    

    // 5. Actualizar imagen si existe
    if (imagen) {
      console.log('Actualizando imagen de la persona...');
      await ImagenPersona.upsert(
        { persona_id: id, persona_imagen: imagen },
        { transaction }
      );
    }

    // 6. Confirmar transacción
    console.log('Confirmando transacción...');
    await transaction.commit();
    console.log('Transacción confirmada exitosamente.');
    return { message: 'Persona actualizada con éxito' };

  } catch (error) {
    // Revertir cambios si algo falla
    console.log('Ocurrió un error. Realizando rollback...');
    await transaction.rollback();
    console.error('Error durante la actualización de persona:', error);
    throw error;
  }
};

exports.updatePersona = async (id, data) => {
  return await Persona.update(
    { ...data, fecha_actualizacion: Sequelize.fn('GETDATE') },
    { where: { id, eliminado: 'N' } }
  );
};

exports.updatePersonaImage = async (id, imagen) => {
  if (!id) {
    console.log('Error: El ID de la persona no fue proporcionado');
    throw new Error('El ID de la persona debe ser proporcionado');
  }

  if (!imagen) {
    console.log('Error: No se proporcionó ninguna imagen');
    throw new Error('No se proporcionó ninguna imagen');
  }

  const transaction = await sequelize.transaction();
  console.log('Iniciando transacción...');

  try {
    // Subir la nueva imagen a Firebase
    console.log('Subiendo la nueva imagen a Firebase...');
    const { downloadURL } = await uploadFile(imagen, null, null, 'FilesPersonas');
    console.log('Imagen subida, URL:', downloadURL);

    // Obtener la referencia de la imagen actual
    console.log('Buscando imagen existente para la persona con ID:', id);
    const persona = await ImagenPersona.findOne({
      where: { persona_id: id }
    }, { transaction });

    if (persona) {
      console.log('Imagen actual encontrada:', persona.persona_imagen);
      const previousImageURL = persona.persona_imagen;

      // Eliminar la imagen anterior de Firebase Storage
      console.log('Eliminando la imagen anterior de Firebase Storage:', previousImageURL);
      const previousImageRef = ref(storage, previousImageURL);
      await deleteObject(previousImageRef); 

      // Actualizar la imagen en la base de datos
      console.log('Actualizando la nueva URL de la imagen en la base de datos...');
      await ImagenPersona.update(
        { persona_imagen: downloadURL },
        { where: { persona_id: id }, transaction }
      );
    } else {
      console.log('No se encontró imagen existente, creando nueva entrada...');
      // Insertar una nueva imagen si no existe
      await ImagenPersona.create(
        { persona_id: id, persona_imagen: downloadURL },
        { transaction }
      );
    }

    // Commit de la transacción
    console.log('Realizando commit de la transacción...');
    await transaction.commit();
    console.log('Transacción completada con éxito.');
    return { message: 'Imagen de la persona actualizada correctamente' };
  } catch (error) {
    console.log('Error durante la transacción:', error.message);
    
    // Rollback de la transacción
    if (transaction) {
      console.log('Realizando rollback de la transacción...');
      await transaction.rollback();
    }
    throw new Error('Error al actualizar la imagen de la persona');
  }
};

exports.deletePersona = async (id, user_id,roles) => {
  try{
    const transaction = await sequelize.transaction();
    await Persona.update(
      { eliminado: 'S', fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
      { where: { id }, transaction }
    );    
    for(role of roles){
      switch(role){
        case roleNames.PresidenteClub:
          const checkPresidenteClub = await PresidenteClub.findOne({
            where: { presidente_id: id, activo: 1 },
            transaction
          });
          const checkClub = await Club.findOne({
            where: { id: checkPresidenteClub.club_id },
            transaction
          });
          await checkPresidenteClub.update({
            presidente_id: id,
            club_id: checkClub.id,
            activo: 0,
            delegado: 'N',
          },{transaction});

          await checkClub.update({
            presidente_asignado: 'N'
          },{transaction});
      }
    }


    await transaction.commit();
  }catch(error){
    console.log(error)
    await transaction.rollback();
    throw error;
  }
};

exports.activatePersona = async (id, user_id) => {
  return await Persona.update(
    { eliminado: 'N', fecha_actualizacion: Sequelize.fn('GETDATE'), user_id },
    { where: { id } }
  );
};

exports.searchPersonas = async (searchTerm) => {
  try {
    const personas = await sequelize.query(`
      SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
      WHERE
        (Persona.nombre LIKE :searchTerm OR Persona.apellido LIKE :searchTerm)
        AND Persona.eliminado = 'N'
    `, {
      replacements: { searchTerm: `%${searchTerm}%` }, 
      type: sequelize.QueryTypes.SELECT
    });

    return personas; 
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};
exports.searchPersonasSinRolJugador = async (searchTerm) => {
  try {
    const personas = await sequelize.query(`
      SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
      LEFT JOIN
        PersonaRol
      ON
        Persona.id = PersonaRol.persona_id
      WHERE
        (Persona.nombre LIKE :searchTerm OR Persona.apellido LIKE :searchTerm)
        AND Persona.eliminado = 'N'
        AND (PersonaRol.rol_id IS NULL OR PersonaRol.rol_id != 5)  -- Excluir personas con rol de jugador
    `, {
      replacements: { searchTerm: `%${searchTerm}%` },
      type: sequelize.QueryTypes.SELECT
    });

    return personas;
  } catch (error) {
    console.error('Error al buscar personas sin rol de jugador:', error);
    throw new Error('Error al buscar personas sin rol de jugador');
  }
};


exports.updatePersonaImage = async (id, imagen) => {
  if (!id) {
    console.log('Error: El ID de la persona no fue proporcionado');
    throw new Error('El ID de la persona debe ser proporcionado');
  }

  if (!imagen) {
    console.log('Error: No se proporcionó ninguna imagen');
    throw new Error('No se proporcionó ninguna imagen');
  }

  const transaction = await sequelize.transaction();
  console.log('Iniciando transacción...');

  try {
    // Subir la nueva imagen a Firebase
    console.log('Subiendo la nueva imagen a Firebase...');
    const { downloadURL } = await uploadFile(imagen, null, null, 'FilesPersonas');
    console.log('Imagen subida, URL:', downloadURL);

    // Obtener la referencia de la imagen actual
    console.log('Buscando imagen existente para la persona con ID:', id);
    const persona = await ImagenPersona.findOne({
      where: { persona_id: id }
    }, { transaction });

    if (persona) {
      console.log('Imagen actual encontrada:', persona.persona_imagen);
      const previousImageURL = persona.persona_imagen;

      // Eliminar la imagen anterior de Firebase Storage
      console.log('Eliminando la imagen anterior de Firebase Storage:', previousImageURL);
      const previousImageRef = ref(storage, previousImageURL);
      await deleteObject(previousImageRef); 

      // Actualizar la imagen en la base de datos
      console.log('Actualizando la nueva URL de la imagen en la base de datos...');
      await ImagenPersona.update(
        { persona_imagen: downloadURL },
        { where: { persona_id: id }, transaction }
      );
    } else {
      console.log('No se encontró imagen existente, creando nueva entrada...');
      // Insertar una nueva imagen si no existe
      await ImagenPersona.create(
        { persona_id: id, persona_imagen: downloadURL },
        { transaction }
      );
    }

    // Commit de la transacción
    console.log('Realizando commit de la transacción...');
    await transaction.commit();
    console.log('Transacción completada con éxito.');
    return { message: 'Imagen de la persona actualizada correctamente' };
  } catch (error) {
    console.log('Error durante la transacción:', error.message);
    
    // Rollback de la transacción
    if (transaction) {
      console.log('Realizando rollback de la transacción...');
      await transaction.rollback();
    }
    throw new Error('Error al actualizar la imagen de la persona');
  }
};