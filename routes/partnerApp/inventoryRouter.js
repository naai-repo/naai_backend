const router = require("express").Router();
const mongoose = require("mongoose");
const Booking = require("../../model/partnerApp/Booking");
const Product = require("../../model/partnerApp/inventory/product.model");

// serviceid:65cc86948762bbbf1a76ff1e
router.get("/", async (req, res) => {
  try {
   res.json({daat:'hey yall'})
  } catch (err) {
    res.status(500).json(err);
  }
});

// router.post("/add", async (req, res) => {
//   const newBooking = new Booking(req.body);
//   try {
//     const booking = await newBooking.save();
//     res.status(200).json(booking);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

module.exports = router;

