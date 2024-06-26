const jwt = require("jsonwebtoken");
const wrapperMessage = require("../helper/wrapperMessage");

const jwtVerify = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const accessToken = req.cookies.token;  
  if(accessToken){
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.json(wrapperMessage("failed", "Token in the cookie is not Valid"));
      }
      req.user = user;
      next();
    });
  }else if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.json(wrapperMessage("failed", "Token is not Valid"));
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json(wrapperMessage("failed", "You are not authenticated!"));
  }
};

module.exports = jwtVerify;
