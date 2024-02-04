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

const createHtml = (booking, user, salon) => {
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  let serviceMap = booking.artistServiceMap.map((obj) => {
    return `
        <p>Service Id : ${obj.artistId}</p>
        <p>Artist Id : ${obj.serviceId}</p>
        <p>Timeslot : ${obj.timeSlot.start} - ${obj.timeSlot.end}</p>
    `;
  });
  let servicesData = serviceMap.join("&ensp;");
  return `
    <div>
        <h1>Booking Details</h1>
        <p>Booking Id: ${booking._id}</p>
        <p>Booking Type: ${booking.bookingType}</p>
        <p>Booking Date: ${new Date(booking.bookingDate).toLocaleString(
          "en-GB",
          dateOptions
        )}</p>
        <p>Booking Time: ${booking.timeSlot.start}</p>
        <p>Booking Payment Status: ${booking.paymentStatus}</p>
        <p>Booking User: ${user.name}</p>
        <p>User Id: ${user._id}</p>
        <p>User Phonenumber: ${user.phoneNumber}</p>
        <p>Salon Name: ${salon.name}</p>
        <p>Salon Phonenumber: ${salon.phoneNumber}</p>
        <h2>Services Taken: </h2>
        &ensp;${servicesData}
    </div>
    `;
};
const mailOptions = (booking, user, salon) => {
    return {
        from: process.env.EMAIL_USER, // sender address
        to: process.env.RECIEVER_EMAIL, // list of receivers
        subject: "Booking Confirmed", // Subject line
        text: "Booking confirmed!", // plain text body
        html: createHtml(booking, user, salon), // html body
    }
};

const sendMail = async (booking, user, salon) => {
  try {
    await transporter.sendMail(mailOptions(booking, user ,salon));
    console.log("Mail Sent to Naai!");
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendMail;
