const { sequelize } = require('../models');
const { Categoria , PersonaRol } = require('../models');

const seedCategorias = async () => {
  let transaction;
  try {
    console.log('Iniciando la transacción...');
    transaction = await sequelize.transaction();

    const presidenteAsociacion = await PersonaRol.findOne({
      where: { rol_id: 1 },
      attributes: ['persona_id'],
      raw: true, // Para obtener solo el objeto plano sin metadatos de Sequelize
    });
    

    // Datos de las categorías
    const categorias = [
      { nombre: "1ras de Honor", genero: "V", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 202, costo_inscripcion: 145 },
      { nombre: "3ras Ascenso", genero: "D", division: "MY", edad_minima: null, edad_maxima: null,  costo_traspaso: 259, costo_inscripcion: 115 },
      { nombre: "1ras de Honor", genero: "D", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 140, costo_inscripcion: 177 },
      { nombre: "Maxis", genero: "V", division: "MY", edad_minima: 35, edad_maxima: null, costo_traspaso: 233, costo_inscripcion: 96 },
      { nombre: "Maxis", genero: "D", division: "MY", edad_minima: 35, edad_maxima: null, costo_traspaso: 284, costo_inscripcion: 120 },
      { nombre: "Juveniles", genero: "V", division: "MN", edad_minima: 18, edad_maxima: 19, costo_traspaso: 350, costo_inscripcion: 132 },
      { nombre: "Juveniles", genero: "D", division: "MN", edad_minima: 18, edad_maxima: 19, costo_traspaso: 478, costo_inscripcion: 225 },
      { nombre: "Cadetes", genero: "V", division: "MN", edad_minima: 16, edad_maxima: 17, costo_traspaso: 312, costo_inscripcion: 79 },
      { nombre:"Cadetes", genero: "D", division: "MN", edad_minima: 16, edad_maxima: 17,  costo_traspaso: 188, costo_inscripcion: 92 },
      { nombre: "Infantil", genero: "V", division: "MN", edad_minima: 14, edad_maxima: 15, costo_traspaso: 492, costo_inscripcion: 217 },
      { nombre: "Infantil", genero: "D", division: "MN", edad_minima: 14, edad_maxima: 15, costo_traspaso: 104, costo_inscripcion: 151 },
      { nombre: "3ras Ascenso", genero: "V", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 199, costo_inscripcion: 65 },
      { nombre: "1ras Ascenso", genero: "D", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 500, costo_inscripcion: 175 },
      { nombre: "1ras Ascenso", genero: "V", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 426, costo_inscripcion: 200 },
      { nombre: "2das Ascenso", genero: "D", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 325, costo_inscripcion: 75 },
      { nombre: "2das Ascenso", genero: "V", division: "MY", edad_minima: null, edad_maxima: null, costo_traspaso: 485, costo_inscripcion: 90 },
      { nombre: "Senior", genero: "D", division: "MY", edad_minima: 43, edad_maxima: null, costo_traspaso: 367, costo_inscripcion: 243 },
      { nombre: "Senior", genero: "V", division: "MY", edad_minima: 43, edad_maxima: null, costo_traspaso: 426, costo_inscripcion: 230 },
      { nombre: "Mini", genero: "D", division: "MN", edad_minima: 12, edad_maxima: 13, costo_traspaso: 235, costo_inscripcion: 120 },
      { nombre: "Mini", genero: "V", division: "MN", edad_minima: 12, edad_maxima: 13, costo_traspaso: 321, costo_inscripcion: 210 }
    ];

    console.log('Insertando categorías en la tabla Categoria...');
    for (const categoria of categorias) {
      await Categoria.create(
        {
          ...categoria,
          fecha_registro: sequelize.fn('GETDATE'),
          fecha_actualizacion: sequelize.fn('GETDATE'),
          eliminado: 'N',
          user_id: presidenteAsociacion ? presidenteAsociacion.persona_id : null
        },
        { transaction }
      );
      console.log(`Categoría "${categoria.nombre}" insertada.`);
    }

    console.log('Confirmando la transacción...');
    await transaction.commit();
    console.log('Seed de categorías completado exitosamente.');
  } catch (error) {
    console.error('Error durante el seed de categorías:', error);
    if (transaction) {
      console.log('Deshaciendo la transacción...');
      await transaction.rollback();
    }
  } finally {
    console.log('Cerrando la conexión a la base de datos...');
    await sequelize.close();
  }
};

seedCategorias();
