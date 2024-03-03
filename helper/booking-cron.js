const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('../model/partnerApp/Booking'); // Assuming your Booking model is defined in a separate file


app.use(express.json());
app.use(express.urlencoded({extended: true}));
require('dotenv').config();
const url = `mongodb+srv://naaiadmn:naaiadmn@cluster0.rg1ncj1.mongodb.net/naai`;

 await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
 })

cron.schedule('*/10 * * * *', async () => {
   
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    try {
     
        const bookingsToUpdate = await Booking.find({
            bookingDate: { $gte: tenMinutesAgo },
            // bookingStatus: { $ne: "completed" } iffneed be
        });
           console.log('klklkl');
        await Promise.all(bookingsToUpdate.forEach(booking => {
            console.log(booking)
            booking.bookingStatus = "in-progress";
            return booking.save();
        }));

        console.log(`Updated ${bookingsToUpdate.length} bookings to "in-progress"`);
    } catch (error) {
        console.error(error);
    }
});
