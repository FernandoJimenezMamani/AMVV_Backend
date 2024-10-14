module.exports = (sequelize, DataTypes) => {
  const ArbitroPartido = sequelize.define('ArbitroPartido', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    arbitro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Persona', 
        key: 'id',
      }
    },
    partido_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Partido', 
        key: 'id',
      }
    },
  }, {
    tableName: 'Arbitro_Partido',
    timestamps: false,
  });

  ArbitroPartido.associate = (models) => {
    ArbitroPartido.belongsTo(models.Persona, { foreignKey: 'arbitro_id', as: 'arbitro' });
    models.Persona.hasMany(ArbitroPartido, { foreignKey: 'arbitro_id', as: 'partidosArbitrados' });

    ArbitroPartido.belongsTo(models.Partido, { foreignKey: 'partido_id', as: 'partido' });
    models.Partido.hasMany(ArbitroPartido, { foreignKey: 'partido_id', as: 'arbitros' });
  };

  return ArbitroPartido;
};
