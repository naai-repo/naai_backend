const nodemailer = require("nodemailer");

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

const json = {
    name: "Deepanshu",
    bookingId: "111002031239",
    time: "10:00 - 12:00",
}

const mailOptions = {
    from: process.env.EMAIL_USER, // sender address
    to: "naai.admn@gmail.com", // list of receivers
    subject: "Test", // Subject line
    text: "This is to test what we are sending", // plain text body
    html: "<b>Hello world?</b>", // html body
};

// naai-bookings@nodemailer-413010.iam.gserviceaccount.com

const sendMail = async (transporter, mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log(err);
    }
}

sendMail(transporter, mailOptions);