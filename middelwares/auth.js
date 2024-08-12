/**This middelware authenticates jwt token by fetching it from authorization headers
 * or cookies */

const jwt = require("jsonwebtoken");

const authenticateJwt = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log({ token });

  if (!token) {
    // Token not found, send a response with status 401
    return res.status(401).json({
      status: "fail",
      message: "Invalid credential. Please log in again!",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, verifiedJwt) => {
    if (err) {
      // Token verification failed, send a response with status 401
      return res.status(401).json({
        status: "fail",
        message: "Your token has expired! Please log in again.",
      });
    } else {
      // Token is valid
      req.user = verifiedJwt.id;
      req.userType = verifiedJwt.userType;
      console.log(token);
      console.log("user", req.user, "userType", req.userType);

      next();
    }
  });
};

module.exports = authenticateJwt;
