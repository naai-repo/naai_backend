const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../../model/customerApp/User");
const wrapperMessage = require("../../helper/wrapperMessage");
const sendOTPVerification = require("../../helper/sendOTPVerification");

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// User Signup


router.post("/signup", (req, res) => {
  let { name, password, phoneNumber } = req.body;
  name = name.trim();
  password = password.trim();

  if (name == "" || password == "") {
    res.json(wrapperMessage("failed", "Empty input fields!"));
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json(wrapperMessage("failed", "Invalid name entered"));
  } else if (password.length < 8) {
    res.json(wrapperMessage("failed", "Password is too short!"));
  } else {
    // checking if user already exists

    User.find({ phoneNumber })
      .then((result) => {
        if (result.length) {
          // User Already exists
          res.json(
            wrapperMessage(
              "failed",
              "User with this Phone number already exists!"
            )
          );
        } else {
          // try to create new user
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newUser = new User({
                name,
                password: hashedPassword,
                phoneNumber,
              });

              newUser
                .save()
                .then((result) => {
                  sendOTPVerification(result, res);
                })
                .catch((err) => {
                  console.log(err);
                  res.json(
                    wrapperMessage(
                      "failed",
                      "An error occured while saving the User!"
                    )
                  );
                });
            })
            .catch((err) => {
              res.json(
                wrapperMessage(
                  "failed",
                  "An error occured while hashing password!"
                )
              );
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json(
          wrapperMessage(
            "failed",
            "An error occured while checking existing User!"
          )
        );
      });
  }
});

// User Login
router.post("/login", (req, res) => {
  let { password, user } = req.body;
  password = password.trim();
  if (password == "") {
    res.json(wrapperMessage("failed", "Empty Credentials Supplied!"));
  } else {
    let criteria = isNaN(Number(user))
      ? { email: user }
      : { phoneNumber: user };
    User.find(criteria)
      .then((data) => {
        if (data.length) {
          // User Exists
          const hashedPassword = data[0].password;
          bcrypt
            .compare(password, hashedPassword)
            .then((result) => {
              if (result) {
                let user = {
                  id: data[0]._id,
                  name: data[0].name,
                  email: data[0].email,
                  phoneNumber: data[0].phoneNumber,
                  verified: data[0].verified,
                };
                const accessToken = jwt.sign(
                  user,
                  process.env.ACCESS_TOKEN_SECRET
                );

                user = { ...user, accessToken };
                res.json(wrapperMessage("success", "", [user]));
              } else {
                res.json(wrapperMessage("failed", "Invalid password entered!"));
              }
            })
            .catch((err) => {
              res.json(
                wrapperMessage(
                  "failed",
                  "An Error occured while comparing passwords!"
                )
              );
            });
        } else {
          res.json(wrapperMessage("failed", "Invalid credentials entered!"));
        }
      })
      .catch((err) => {
        console.log(err);
        res.json(
          wrapperMessage(
            "failed",
            "An error occured while checking for existing partner!"
          )
        );
      });
  }
});

// Forget Password Routes
router.post("/forgotPassword", async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    if (!phoneNumber) {
      throw new Error("Please enter valid phone number!");
    } else {
      let data = await User.find({ phoneNumber });
      if (!data.length) {
        throw new Error(
          "No account found with this phone number! Please Enter correct phone number."
        );
      } else {
        sendOTPVerification(data[0], res);
      }
    }
  } catch (err) {
    res.json(wrapperMessage("failed", err.message));
  }
});

module.exports = router;
