exports.uploadBook = async (req, res) => {
  //check if the book exists
  // add the book detail
};
const { User } = require("../models");
const defineAbilitiesFor = require("../utils/abilities");
const { returnUser } = require("../utils/auth");
// exports.getAllOwners = async (req, res) => {
//   try {
//     const userId = req.user;
//     const user = await returnUser();
//     const abilities = defineAbilitiesFor(user);

//     if (user) {
//       if (!abilities.can("read", "User")) {
//         return res.status(403).json({
//           status: "fail",
//           message: "You dont have access",
//         });
//       }
//       const owners = await User.findAll({ where: { userType: "owner" } });
//     }
//   } catch (error) {}
// };
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

// exports.getOwnerRequests = async (req, res) => {
//   try {
//     const userId = req.user;
//     const user = await returnUser(userId);
//     if (user) {
//       const abilities = defineAbilitiesFor(user);
//       if (!abilities.can("read", "User")) {
//         return res.status(400).json({
//           message: "You dont have the access",
//         });
//       }
//       const owners = await User.findAll({
//         where: { userType: "pending", requestStatus: "requested" },
//       });
//       if (owners) {
//         return res.status(200).json({
//           status: "sucess",
//           data: owners,
//         });
//       }
//     }
//   } catch (error) {
//     console.log({ error });
//     return new AppError({ message: error.message, statusCode: 500 });
//   }
// };
exports.disableOwners = async (req, res) => {
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
      status: "disabled",
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
