const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  validity: {
    type: { type: String, enum: ['15_days', 'monthly', 'quarterly', 'yearly'], required: true },
    duration: { type: Number, required: true } // Duration in days
  },
  cost: { type: Number, required: true },
  services: [String], // List of services included
  salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon", required: true } // Reference to Salon
}, { timestamps: true });

const Membership = mongoose.model("Membership", membershipSchema);

module.exports = Membership;

// salon id is mandatory cause when you r creating a membership it must associated with salon/ salonId