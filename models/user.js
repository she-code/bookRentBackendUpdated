"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.BookCopy, {
        foreignKey: "ownerId",
        as: "ownedBooks",
      });
      User.hasMany(models.Rent, { foreignKey: "rentedBy", as: "rentedBooks" });
      User.hasMany(models.Rent, { foreignKey: "ownerId", as: "addedBooks" });
    }
  }
  User.init(
    {
      isDisabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },

      isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      firstName: { type: DataTypes.STRING, allowNull: false },

      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      lastName: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
      walletBalance: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        default: "pending",
      },
      requestStatus: {
        type: DataTypes.STRING,
      },
      userType: { type: DataTypes.STRING, allowNull: false },
      phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
