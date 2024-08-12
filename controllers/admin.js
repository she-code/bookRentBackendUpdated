const { User } = require("../models");

exports.approveBooks = async (req, res) => {};
exports.getAllOwners = async (req, res) => {};
const defineAbilitiesFor = require("../utils/abilities");
const { Book } = require("../models"); // Adjust the path to your models
const { returnUser } = require("../utils/auth");

// Update a book
exports.approveOwners = async (req, res) => {
  try {
    const userId = req.user;
    const user = await returnUser(userId);
    const ability = defineAbilitiesFor(user);

    const ownerId = req.params.id;
    const owner = await User.findByPk(ownerId);

    if (!owner) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    // Check if the user has permission to update the owner
    if (!ability.can("update", "User")) {
      return res.status(403).json({ status: "fail", message: "Forbidden" });
    }

    // Update the owner details
    const Owner = await owner.update({
      requestStatus: "approved",
      userType: "owner",
      status: "active",
    });
    res.status(200).json({ status: "success", data: Owner });
  } catch (error) {
    console.error("Error updating owner:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating the owner",
    });
  }
};
