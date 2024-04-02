const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const salesSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: function (val) {
          return val.toString().length === 10;
        },
        message: (val) => `${val.value} has to be 10 digits`,
      },
    },
    referral_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      default: new mongoose.Types.ObjectId(process.env.NULL_OBJECT_ID),
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

salesSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

salesSchema.methods.validatePassword = async function validatePassword(data) {
  return bcrypt.compare(data, this.password);
};

const Sales = mongoose.model("Sale", salesSchema);
module.exports = Sales;
