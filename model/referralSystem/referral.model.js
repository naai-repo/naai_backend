const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },
    partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: new mongoose.Types.ObjectId(process.env.NULL_OBJECT_ID),
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: new mongoose.Types.ObjectId(process.env.NULL_OBJECT_ID),
    },
    sales_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      default: new mongoose.Types.ObjectId(process.env.NULL_OBJECT_ID),
    },
    numberOfReferrals: {
      type: Number,
      default: 0,
    },
    paymentsHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
  },
  { timestamps: true }
);

referralSchema.pre("validate", function (next) {
    if(!this.partner_id && !this.sales_id && !this.customer_id){
        next(new Error("Referral must have a partner_id or sales_id or customer_id!"));
    }
    next();
});

const Referral = mongoose.model("Referral", referralSchema);
module.exports = Referral;
