const router = require('express').Router();
const mongoose = require('mongoose');
const Partner = require('../model/Partner');
const PartnerOTPVerification = require('../model/PartnerOTPVerification');
const bcrypt = require('bcrypt');
const fast2sms = require("fast-two-sms");
const otplib = require('otplib');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

const errMessage = (status, message = "", data = "") => {
    let errObj = {status, message,data};
    return errObj;
}

// Partner Signup
router.post('/signup', (req, res) => {
    let {name, email, password, phoneNumber} = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if(name == "" || email == "" || password == ""){
        res.json(
            errMessage(
                "failed",
                "Empty input fields!"
            )
        );
    }else if(! /^[a-zA-Z ]*$/.test(name)){
        res.json(
            errMessage(
                "failed",
                "Invalid name entered",
            )
        );
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json(
            errMessage(
                "failed",
                "Invalid email entered"
            )
        );
    }else if(password.length < 8){
        res.json(
            errMessage(
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
                    errMessage(
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
                        // sendOTPVerification(result, res);
                        res.json(errMessage("success", "", result));
                    }).catch(err => {
                        console.log(err);
                        res.json(
                            errMessage(
                                "failed",
                                "An error occured while saving the Partner!"
                            )
                        )
                    })

                }).catch(err => {
                    res.json(
                        errMessage(
                            "failed",
                            "An error occured while hashing password!"
                        )
                    )
                })
            }
        }).catch(err => {
            console.log(err);
            res.json(
                errMessage(
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
            errMessage(
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
                        res.json(errMessage("success", "", data));
                    }else{
                        res.json(
                            errMessage(
                                "failed",
                                "Invalid password entered!",
                            )
                        )
                    }
                }).catch(err => {
                    res.json(
                        errMessage(
                            "failed",
                            "An Error occured while comparing passwords!"
                        )
                    )
                })
            }else{
                res.json(
                    errMessage(
                        "failed",
                        "Invalid credentials entered!"
                    )
                )
            }
        }).catch(err => {

            res.json(
              errMessage(
                "failed",
                "An error occured while checking for existing partner!"
              )
            );
        })
    }
})

// const secret = otplib.authenticator.generateSecret();
// const sendOTPVerification = async ({_id, phoneNumber}, res) => {
//     try{
//         const otp = otplib.authenticator.generate(secret);
//         var options = {
//             authorization : "OVG2Xfy9eM5WxaokSuZ4Fs6cTNdqhUKwptCljvrLm1gQP7JBi3y3rk1V29GOPtfQEwl5TKjxX0ivqzUD", //fill this with your api
//             message: `your OTP verification code is ${otp}`,
//             numbers: [`${phoneNumber}`],
//         };
//         const saltRounds = 10;
//         const hashedOtp = await bcrypt.hash(otp, saltRounds);
//         const newOTPVerification = await new PartnerOTPVerification({
//             userId: _id,
//             otp: hashedOtp,
//             createdAt: Date.now(),
//             expiresAt: Date.now() + 3600000,
//         });

//         await newOTPVerification.save();
//         const data = await fast2sms.sendMessage(options);
//         console.log("DATA: ", data);
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
//         res.json(errMessage("failed", err.message))
//     }
// }

module.exports = router;