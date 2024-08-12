const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
exports.createSendToken = (user, req, res) => {
  try {
    // Generate JWT token
    console.log("Inside createSendToken function");

    const token = generateJwtToken(user.id, user.userType);

    // Cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      httpOnly: true,
    };

    // Secure cookie in production
    if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true;
    }

    // Send cookie with token
    res.cookie("jwt", token, cookieOptions);

    // Respond with success
    return res.status(200).json({
      status: "success",
      message: "Token sent successfully",
      token,
    });
  } catch (error) {
    // Handle any errors that occur
    console.error("Error in createSendToken:", error);
    res.status(500).json({
      status: "fail",
      message: "An error occurred while sending the token",
    });
  }
};

generateHashedPassword = async (cleanPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);
  return hashedPassword;
};

generateJwtToken = (userId, userType, expiresIn = "0.5y") => {
  const token = jwt.sign(
    { id: userId, userType: userType },
    process.env.JWT_SECRET,
    {
      expiresIn,
    }
  );
  return token;
};

exports.generateHashedPassword = async (cleanPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);
  return hashedPassword;
};

exports.returnUser = async (userID) => {
  try {
    const user = await User.findByPk(userID, {
      attributes: { exclude: ["password"] },
    });
    if (user) {
      return user;
    }
    return null;
  } catch (error) {
    console.log({ error });
  }
};
