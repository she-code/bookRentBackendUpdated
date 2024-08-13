"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Rent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Rent.belongsTo(models.BookCopy, {
        foreignKey: "bookCopyId",
        as: "bookCopy",
      });

      Rent.belongsTo(models.User, {
        foreignKey: "rentedBy",
        as: "renter",
      });

      Rent.belongsTo(models.User, {
        foreignKey: "ownerId",
        as: "owner",
      });

      Rent.belongsTo(models.Book, {
        foreignKey: "bookId",
      });
    }
  }
  Rent.init(
    {
      rentedBy: { type: DataTypes.INTEGER, allowNull: false },
      bookCopyId: { type: DataTypes.INTEGER, allowNull: false },
      bookId: { type: DataTypes.INTEGER, allowNull: false },
      ownerId: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false },
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Rent",
    }
  );
  return Rent;
};
