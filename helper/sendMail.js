const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    type: "login",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});


const mailOptions = (htmlData,to, text, subject) => {
    return {
        from: process.env.EMAIL_USER, // sender address
        to: [to, process.env.EMAIL_USER, process.env.CEO_MAIL], // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: htmlData, // html body
    }
};

// naai-bookings@nodemailer-413010.iam.gserviceaccount.com

const sendMail = async (htmlData, to,text, subject) => {

  try {
    await transporter.sendMail(mailOptions(htmlData, to, text, subject));
    console.log("Mail Sent to Naai!");
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendMail;
