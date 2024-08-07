const mongoose = require("mongoose");

// Schema for Salary
const SalarySchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      default: Date.now,
    },
    name:String,
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      default: null,
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
    effectiveMonth: {
      type: Number, // 1-12
  
    },
    effectiveYear: {
      type: Number, // 4-digit year
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Salary", SalarySchema);

