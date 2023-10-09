const router = require('express').Router();
const bcrypt = require('bcrypt');

const Partner = require('../model/Partner');
const wrapperMessage = require('../helper/wrapperMessage');
const sendOTPVerification = require('../helper/sendOTPVerification');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Partner Signup
router.post('/signup', (req, res) => {
    let {name, email, password, phoneNumber} = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if(name == "" || email == "" || password == ""){
        res.json(
            wrapperMessage(
                "failed",
                "Empty input fields!"
            )
        );
    }else if(! /^[a-zA-Z ]*$/.test(name)){
        res.json(
            wrapperMessage(
                "failed",
                "Invalid name entered",
            )
        );
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json(
            wrapperMessage(
                "failed",
                "Invalid email entered"
            )
        );
    }else if(password.length < 8){
        res.json(
            wrapperMessage(
                "failed",
                "Password is too short!"
            )
        );
    }else {
        // checking if user already exists

        Partner.find({$or : [{phoneNumber}, {email}]}).then(result => {
            if(result.length){
                // User Already exists
                res.json(
                    wrapperMessage(
                        "failed",
                        "User with this Phone number/ Email already exists!"
                    )
                )
            }else{
                // try to create new user
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newPartner = new Partner({
                        name,
                        email,
                        password: hashedPassword,
                        phoneNumber
                    });

                    newPartner.save().then(result => {
                        sendOTPVerification(result, res);
                        // res.json(wrapperMessage("success", "", result));
                    }).catch(err => {
                        console.log(err);
                        res.json(
                            wrapperMessage(
                                "failed",
                                "An error occured while saving the Partner!"
                            )
                        )
                    })

                }).catch(err => {
                    res.json(
                        wrapperMessage(
                            "failed",
                            "An error occured while hashing password!"
                        )
                    )
                })
            }
        }).catch(err => {
            console.log(err);
            res.json(
                wrapperMessage(
                    "failed",
                    "An error occured while checking existing partner!"
                )
            )
        })
    }
})

// Partner Login
router.post('/login', (req, res) => {
    let {password, phoneNumber} = req.body;
    password = password.trim();
    if(password == ""){
        res.json(
            wrapperMessage(
                "failed",
                "Empty Credentials Supplied!"
            )
        )
    }else{
        Partner.find({phoneNumber}).then(data => {
            if(data.length){
                // User Exists
                
                const hashedPassword = data[0].password;
                bcrypt.compare(password, hashedPassword).then(result => {
                    if(result){
                        res.json(wrapperMessage("success", "", data));
                    }else{
                        res.json(
                            wrapperMessage(
                                "failed",
                                "Invalid password entered!",
                            )
                        )
                    }
                }).catch(err => {
                    res.json(
                        wrapperMessage(
                            "failed",
                            "An Error occured while comparing passwords!"
                        )
                    )
                })
            }else{
                res.json(
                    wrapperMessage(
                        "failed",
                        "Invalid credentials entered!"
                    )
                )
            }
        }).catch(err => {

            res.json(
              wrapperMessage(
                "failed",
                "An error occured while checking for existing partner!"
              )
            );
        })
    }
})

// const secret = otplib.authenticator.generateSecret();
// otplib.authenticator.options = {digits: 6};
// const sendOTPVerification = async ({_id, phoneNumber}, res) => {
//     try{
//         const otp = otplib.authenticator.generate(secret);

//         const saltRounds = 10;
//         const hashedOtp = await bcrypt.hash(otp, saltRounds);
//         const newOTPVerification = await new PartnerOTPVerification({
//             userId: _id,
//             otp: hashedOtp,
//             createdAt: Date.now(),
//             expiresAt: Date.now() + 600000,     //10 min deadline to enter otp
//         });
//         await newOTPVerification.save();

//         const body = {
//             Text: `User Admin login OTP is ${otp} - ${process.env.SENDER_ID}`,
//             Number: phoneNumber,
//             SenderId: process.env.SENDER_ID,
//             DRNotifyUrl: "https://www.domainname.com/notifyurl",
//             DRNotifyHttpMethod: "POST",
//             Tool: "API"
//         }
//         // const data = await await axios.post(`https://restapi.smscountry.com/v0.1/Accounts/${process.env.AUTH_KEY}/SMSes/`,body, {
//         //     auth: {
//         //       username: process.env.AUTH_KEY,
//         //       password: process.env.AUTH_TOKEN
//         //     }
//         //   });

//         res.json({
//             status: "pending",
//             message: "Verification otp message sent",
//             data: {
//                 userId: _id,
//                 phoneNumber,
//                 otp
//             }
//         })

//     }catch(err){
//         res.json(wrapperMessage("failed", err.message))
//     }
// }

module.exports = router;