const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User
  membership: { type: mongoose.Schema.Types.ObjectId, ref: "Membership", required: true }, // Reference to Membership
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  paid: { type: Boolean, default: true },
}, { timestamps: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
