const axios = require('axios')
class CommonUtils {

  static isEmail(email) {
    return /^\S+@\S+\.\S+$/i.test(email);
  }

  static isPhoneNumber(input) {
    return /^\d{10}$/.test(input); // Check if it consists of 10 digits
  }

  static async sendOTPonNumber(phoneNumber) {
    const body = {
      Text: `User Admin login OTP is ${otp} - ${process.env.SENDER_ID}`,
      Number: phoneNumber,
      SenderId: process.env.SENDER_ID,
      DRNotifyUrl: "https://www.domainname.com/notifyurl",
      DRNotifyHttpMethod: "POST",
      Tool: "API",
    };
    // Sends SMS OTP to user.
    const data = await axios.post(
      `https://restapi.smscountry.com/v0.1/Accounts/${process.env.AUTH_KEY}/SMSes/`,
      body,
      {
        auth: {
          username: process.env.AUTH_KEY,
          password: process.env.AUTH_TOKEN,
        },
      }
    );
  }

}

module.exports = CommonUtils;