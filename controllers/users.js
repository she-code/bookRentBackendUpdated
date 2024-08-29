const { User } = require("../models");
const { returnUser } = require("../utils/auth");
const defineAbilitiesFor = require("../utils/abilities");

//
exports.requestToBecomeOwner = async (req, res) => {
  try {
    const userId = req.user;

    // Find the user
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Update request status to 'pending'
    await User.update({ requestStatus: "pending" }, { where: { id: userId } });

    // Respond with success
    res.status(200).json({
      status: "success",
      message: "Request to become owner submitted successfully",
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while submitting the request",
    });
  }
};

exports.getAllOwners = async (req, res) => {
  try {
    const userId = req.user;
    const user = await returnUser(userId);
    console.log({ user });
    if (user) {
      const abilities = defineAbilitiesFor(user);

      if (!abilities.can("read", "User")) {
        return res.status(403).json({
          status: "fail",
          message: "You dont have access",
        });
      }
      const owners = await User.findAll({
        where: { userType: "owner" },
        attributes: { exclude: ["password"] },
      });
      console.log({ owners });
      if (owners.length == 0) {
        return res.status(404).json({
          status: "fail",
          message: "No owners found",
        });
      }
      return res.status(200).json({
        status: "success",
        data: owners,
        message: "Owners retrived successfully",
      });
    }
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      status: "fail",
      message: "Error fetching owners",
    });
  }
};
exports.getAllCustomers = async (req, res) => {
  try {
    const userId = req.user;
    const user = await returnUser(userId);
    if (user) {
      const abilities = defineAbilitiesFor(user);

      if (!abilities.can("read", "User")) {
        return res.status(403).json({
          status: "fail",
          message: "You don't have access",
        });
      }

      console.time("Query Time");
      const customers = await User.findAll({
        where: { userType: "customer" },
        attributes: { exclude: ["password"] },
      });
      console.timeEnd("Query Time");

      if (customers.length === 0) {
        return res.status(404).json({
          status: "fail",
          message: "No customers found",
        });
      }

      return res.status(200).json({
        status: "success",
        data: customers,
        message: "Customers retrieved successfully",
      });
    }
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      status: "fail",
      message: "Error fetching customers",
    });
  }
};

exports.getOwnerRequests = async (req, res) => {
  try {
    const userId = req.user;
    const user = await returnUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("read", "User")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const owners = await User.findAll({
      where: {
        userType: "customer",
        requestStatus: "pending",
        isApproved: false,
      },
      attributes: { exclude: ["password"] },
    });

    if (owners.length === 0) {
      return res.status(404).json({ message: "No owner requests found" });
    }

    return res.status(200).json({
      status: "success",
      data: owners,
    });
  } catch (error) {
    console.error("Error fetching owner requests:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

exports.getOwner = async (req, res) => {
  try {
    const userId = req.user;
    const user = await returnUser(userId);
    const ownerId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("read", "User")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const owners = await User.findByPk(ownerId, {
      attributes: { exclude: ["password"] },
    });

    if (owners.length === 0) {
      return res.status(404).json({ message: "No owner found" });
    }

    return res.status(200).json({
      status: "success",
      data: owners,
    });
  } catch (error) {
    console.error("Error fetching owner:", error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

exports.updateOwnerStatus = async (req, res) => {
  try {
    const userId = req.user;
    const ownerId = req.params.id;
    const { isDisabled } = req.body;

    // Retrieve the user and check permissions
    const user = await returnUser(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("update", "User")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission",
      });
    }

    // Check if the user being updated is an owner
    const owner = await User.findOne({ where: { id: ownerId } });
    if (!owner) {
      return res.status(404).json({
        status: "fail",
        message: "Owner not found",
      });
    }

    if (owner.userType !== "owner") {
      return res.status(400).json({
        status: "fail",
        message: "User is not an owner",
      });
    }

    // Update the user's status and isDisabled field
    const updateValues = {
      status: isDisabled ? "inactive" : "active",
      isDisabled: isDisabled,
    };

    const [updatedCount] = await User.update(updateValues, {
      where: { id: ownerId },
      returning: true,
      plain: true,
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Owner not found",
      });
    }

    // Retrieve the updated owner
    const updatedOwner = await User.findOne({ where: { id: ownerId } });

    return res.status(200).json({
      status: "success",
      message: "Owner status updated successfully",
      data: updatedOwner, // Return the updated owner object
    });
  } catch (error) {
    console.error("Error updating Owner status:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while updating the Owner status",
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userID = req.user;
    const user = await returnUser(userID);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "user not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "user successfully retrived",
      data: user,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      status: "fail",
      message: "Error fetching user",
    });
  }
};

exports.setOwnerApprovalStatus = async (req, res) => {
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

    // Determine the action based on the query parameter
    const { action } = req.body;
    let updatedValues;

    if (action === "approve") {
      updatedValues = {
        isApproved: true,
        userType: "owner",
        status: "active",
        requestStatus: "approved",
      };
    } else if (action === "reject") {
      updatedValues = {
        isApproved: false,
        userType: "customer",
        requestStatus: "rejected",
      };
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid action specified",
      });
    }

    // Update the owner details
    const updatedOwner = await owner.update(updatedValues);
    res.status(200).json({ status: "success", data: updatedOwner });
  } catch (error) {
    console.error("Error updating owner:", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating the owner",
    });
  }
};
