const mongoose = require("mongoose");

// Schema for Salary
const SalarySchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      default: null,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      default: null,
    },
  staffId: {
        type: Number,
        default:0
    },
    earnings: [
      {
        type: {
          type: String,
          enum: ["Basic", "House Rent Allowance", "Bonus", "Other"],

        },
        value: {
          type: Number,
       
        },
      },
    ],
    deductions: [
      {
        type: {
          type: String,
          enum: ["Advance", "Provident Fund", "Income Tax", "Other"],
      
        },
        value: {
          type: Number,
    
        },
      },
    ],
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["bank transfer", "cash", "cheque", "other"],
      default: "bank transfer",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Salary", SalarySchema);