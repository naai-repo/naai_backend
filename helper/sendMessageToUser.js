const axios = require("axios");

const sendMessageToUser = async (user, message) => {
  try {
    const body = {
      Text: `${message} - ${process.env.SENDER_ID}`,
      Number: user.phoneNumber,
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

    console.log("Message Sent to User!");
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendMessageToUser;
