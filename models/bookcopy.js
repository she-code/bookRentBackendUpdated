"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BookCopy extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BookCopy.belongsTo(models.Book, {
        foreignKey: "bookId",
        as: "book",
      });
      BookCopy.belongsTo(models.User, {
        foreignKey: "ownerId",
        as: "owner",
      });
    }
  }
  BookCopy.init(
    {
      bookId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      ownerId: { type: DataTypes.INTEGER, allowNull: false },
      availability: { type: DataTypes.STRING, allowNull: false },
      rentalPrice: { type: DataTypes.FLOAT, allowNull: false },
      condition: { type: DataTypes.STRING, allowNull: false },
      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      rejected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      image: { type: DataTypes.STRING, allowNull: true },
      file: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: "BookCopy",
    }
  );
  return BookCopy;
};
