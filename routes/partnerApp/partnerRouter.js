const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const CommonUtils = require("../../helper/commonUtils");

const Partner = require("../../model/partnerApp/Partner");
const wrapperMessage = require("../../helper/wrapperMessage");
const sendOTPVerification = require("../../helper/sendOTPVerification");
const { isLoggedIn } = require("../../helper/isLoggedIn");
require('../../helper/googleOAuth');

// Partner Signup
router.post("/signup", (req, res) => {
  let { name, email, password, phoneNumber } = req.body;
  name = name.trim();
  email = email.trim();
  password = password.trim();

  if (name == "" || email == "" || password == "") {
    res.json(wrapperMessage("failed", "Empty input fields!"));
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json(wrapperMessage("failed", "Invalid name entered"));
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json(wrapperMessage("failed", "Invalid email entered"));
  } else if (password.length < 8) {
    res.json(wrapperMessage("failed", "Password is too short!"));
  } else {
    // checking if user already exists

    Partner.find({ $or: [{ phoneNumber }, { email }] })
      .then((result) => {
        if (result.length) {
          // User Already exists
          res.json(
            wrapperMessage(
              "failed",
              "User with this Phone number/ Email already exists!"
            )
          );
        } else {
          // try to create new user
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newPartner = new Partner({
                name,
                email,
                password: hashedPassword,
                phoneNumber,
              });

              newPartner
                .save()
                .then((result) => {
                  sendOTPVerification(result, res);
                })
                .catch((err) => {
                  console.log(err);
                  res.json(
                    wrapperMessage(
                      "failed",
                      "An error occured while saving the Partner!"
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
            "An error occured while checking existing partner!"
          )
        );
      });
  }
});


// Partner Login
router.post("/login", (req, res) => {
  let { password, user } = req.body;
  password = password.trim();
  if (password == "") {
    res.json(wrapperMessage("failed", "Empty Credentials Supplied!"));
  } else {
    let criteria = isNaN(Number(user))
      ? { email: user }
      : { phoneNumber: user };
    Partner.find(criteria)
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
                  admin: data[0].admin,
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

// /loginViaOtp

router.post("/loginViaOtp", async (req, res) => {
  try {
    const { userData } = req.body;
    let mailOrPhoneNumber = null;

    if (CommonUtils.isEmail(userData)) {
      mailOrPhoneNumber = { email: userData };
    } else if (CommonUtils.isPhoneNumber(userData)) {
      mailOrPhoneNumber = { phoneNumber: userData };
    } else {
      return res.json({ data: 'error occurred' });
    }

    const result = await Partner.findOne(mailOrPhoneNumber);

    if (result) {
      sendOTPVerification(result, res);
    } else {
      res.json({ data: 'no user Found' });
    }
  } catch (error) {
    res.json({ data: 'error occurred' });
  }
});

// Forget Password Routes
router.post("/forgotPassword", async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    if (!phoneNumber) {
      throw new Error("Please enter valid phone number!");
    } else {
      let data = await Partner.find({ phoneNumber });
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

router.post("/:id/admin", async (req, res) => {
  try {
    let { admin } = req.body;

    let data = await Partner.updateOne({ _id: req.params.id }, { admin });
    if (admin) {
      res.json(wrapperMessage("success", "The user is a Manager now!"));
    } else {
      res.json(wrapperMessage("success", "The user is not a Manager now!"));
    }
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
})

// Google OAuth

router.get('/auth/google',
  passport.authenticate('google', {
    scope:
      ['email', 'profile']
  }
  ));

router.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/partner/user/auth/google/success',
    failureRedirect: '/partner/user/auth/google/failure'
  }));

router.get("/auth/google/failed", (req, res) => {
  res.send("Failed")
})
router.get("/auth/google/success", isLoggedIn, (req, res) => {
  res.json(wrapperMessage("success", "", [req.user]));
})

router.get('/logout', (req, res) => {
  req.session = null;
  req.logout();
  res.json(wrapperMessage("success", "Logged out succesfully!"));
})

module.exports = router;
