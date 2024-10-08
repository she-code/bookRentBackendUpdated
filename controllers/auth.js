const { User } = require("../models");
const { registerSchema, loginSchema } = require("../schema/user");
const { createSendToken, returnUser } = require("../utils/auth");

const bcrypt = require("bcryptjs");

exports.registerUser = async (req, res) => {
  try {
    // get req body

    const data = req.body;
    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      location,
      phoneNumber,
    } = data;
    // validate schema
    registerSchema.parse(data);
    //encrypt password
    const hashedPwd = await generateHashedPassword(password);

    //add to model
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      userType: userType,
      location: location,
      password: hashedPwd,
      status: "active",
      phoneNumber,
    });
    console.log({ user });
    if (user) {
      createSendToken(user, req, res);
      //   res.status(200).json({ status: "sucess", user });
    }
  } catch (error) {
    console.log({ error });
    if (error.name == "SequelizeUniqueConstraintError") {
      res
        .status(500)
        .json({ status: "fail", message: "Email already registered" });
    } else {
      res.status(500).json({ status: "fail", message: error.message });
    }
  }
};

// login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    loginSchema.parse(req.body);
    //search user using email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }
    //compare password
    const passWordCorrect = await bcrypt.compare(password, user.password);
    if (!passWordCorrect) {
      res.status(401).json({
        status: "fail",
        message: "Invalid username or password",
      });
    }
    if (passWordCorrect) {
      user.status = "active";
      await user.save();
      createSendToken(user, req, res);
    }
  } catch (error) {
    console.log(error.message);
  }
};

//logout user
exports.logout = async (req, res) => {
  try {
    const userID = req.user;
    const user = await returnUser(userID);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Update the user's status to inactive
    user.status = "inactive";
    await user.save();

    // Clear the cookie
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    // Send success response
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully and user status updated",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong during logout",
    });
  }
};

exports.registerAsOwner = async (req, res) => {
  try {
    const data = req.body;
    const { firstName, lastName, email, password, location, phoneNumber } =
      data;
    // validate schema
    registerSchema.parse(data);
    //encrypt password
    const hashedPwd = await generateHashedPassword(password);

    //add to model
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      location: location,
      password: hashedPwd,
      phoneNumber: phoneNumber,
      requestStatus: "pending",
      status: "pending",
      userType: "customer",
    });
    console.log({ user });
    if (user) {
      createSendToken(user, req, res);
      //   res.status(200).json({ status: "sucess", user });
    }
  } catch (error) {
    console.log({ error });
    if (error.name == "SequelizeUniqueConstraintError") {
      if (error.errors[0].path == "email") {
        return res
          .status(400)
          .json({ status: "fail", message: "Email already registered" });
      } else {
        return res
          .status(400)
          .json({ status: "fail", message: "Phone number already registered" });
      }
    }

    return res.status(500).json({ status: "fail", message: error.message });
  }
};
