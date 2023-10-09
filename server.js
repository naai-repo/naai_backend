const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();
const axios = require('axios');

// Generate an OTP
otplib.authenticator.options = {digits: 6};
const token = otplib.authenticator.generate(secret);
const auth_key = "1MeSOZiA3SFkdABiFMYd";
const auth_token = "7adiAdJn0BopIkR5EyseBwvTudAX8FEXbfPA78MO";
const url = `https://restapi.smscountry.com/v0.1/Accounts/${auth_key}/SMSes/`
const number = "8860579871";
const senderId = "SMSCOU";
async function sendOtp(){
  const body = {
    Text: `User Admin login OTP is ${token} - SMSCOU`,
    Number: number,
    SenderId: senderId,
    DRNotifyUrl: "https://www.domainname.com/notifyurl",
    DRNotifyHttpMethod: "POST",
    Tool: "API"
  }
  let data = await axios.post(url,body, {
    auth: {
      username: auth_key,
      password: auth_token
    }
  });
  console.log("DATA: ", data);
}
sendOtp();