const router = require('express').Router();
const Partner = require('../model/Partner');
const PartnerOTPVerification = require('../model/PartnerOTPVerification');
const bcrypt = require('bcrypt');
const sendOTPVerification = require('../helper/sendOTPVerification');
const wrapperMessage = require('../helper/wrapperMessage');

// Verify OTP

router.post("/verify", async (req, res) =>{
    try{
        let {userId, otp} = req.body;
        if(!userId || !otp){
            throw Error("Empty otp details are not allowed");
        }else{
            let partnerOTPVerificationRecords = await PartnerOTPVerification.find({userId});
            if(partnerOTPVerificationRecords.length <= 0){
                // no record found
                throw new Error("Account record doesn't exist or has been verified already. Please sign up or log in.");
            }else{
                // user OTP record exists
                const {expiresAt} = partnerOTPVerificationRecords[0];
                const hashedOtp = partnerOTPVerificationRecords[0].otp;

                if(expiresAt < Date.now()){
                    // user OTP record has expired
                    await PartnerOTPVerification.deleteMany({userId});
                    throw new Error("Code has expired. Please request again.");
                }else{
                    const validOTP = await bcrypt.compare(otp, hashedOtp);

                    if(!validOTP){
                        throw new Error("Invalid code passed. Please enter valid OTP.");
                    }else{
                        await Partner.updateOne({_id: userId}, {verified: true});
                        await PartnerOTPVerification.deleteMany({userId});
                        res.json({
                            status: "VERIFIED",
                            message: "User phone number successfully verified."
                        })
                    }
                }
            }
        }
    }catch(err){
        res.json(
            wrapperMessage("failed", err.message)
        )
    }
})

// Resend OTP

router.post("/resend", async(req, res) =>{
    try{
        let {userId, phoneNumber} = req.body;

        if(!userId || !phoneNumber){
            throw Error("Empty partner details are not allowed!");
        }else{
            // deleting existing records and resending OTP
            await PartnerOTPVerification.deleteMany({userId});
            sendOTPVerification({_id: userId, phoneNumber}, res);
        }
    }catch(error){
        res.json(
            wrapperMessage("failed", error.message)
        )
    }
})

router.post("/changePassword", async (req, res) =>{
    try{
        let {userId, otp, newPassword} = req.body;
        if(!userId || !otp || !newPassword){
            throw Error("Empty otp details are not allowed");
        }else{
            let partnerOTPVerificationRecords = await PartnerOTPVerification.find({userId});
            if(partnerOTPVerificationRecords.length <= 0){
                // no record found
                throw new Error("Account record doesn't exist. Please retry.");
            }else{
                // user OTP record exists
                const {expiresAt} = partnerOTPVerificationRecords[0];
                const hashedOtp = partnerOTPVerificationRecords[0].otp;

                if(expiresAt < Date.now()){
                    // user OTP record has expired
                    await PartnerOTPVerification.deleteMany({userId});
                    throw new Error("Code has expired. Please request again.");
                }else{
                    const validOTP = await bcrypt.compare(otp, hashedOtp);

                    if(!validOTP){
                        throw new Error("Invalid code passed. Please enter valid OTP.");
                    }else{
                        const saltRounds = 10;
                        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

                        await Partner.updateOne({_id: userId}, {password: hashedNewPassword});
                        await PartnerOTPVerification.deleteMany({userId});
                        res.json({
                            status: "success",
                            message: "User password successfully changed."
                        })
                    }
                }
            }
        }
    }catch(err){
        res.json(
            wrapperMessage("failed", err.message)
        )
    }
})

module.exports = router;