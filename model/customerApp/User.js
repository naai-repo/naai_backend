const mongoose = require("mongoose");

// Schema for Partners
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: ""
    },
    gender: {
      type: String,
      enum: ["male", "female", "not specified"],
      default: "not specified",
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
    birthDate:{
      type: String,
      default: ""
    },
    aniversary:{
      type: String,
      default: ""
    },
    userType: {
      type: String,
      enum: ["walkin", "app"],
      default: "walkin",
      lowercase: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "deactivated"],
      lowercase: true,
      default: "active",
    },
    favourite: {
      salons: [
        {
          type: mongoose.Schema.ObjectId,
        },
      ],
      artists: [
        {
          type: mongoose.Schema.ObjectId,
        },
      ],
    },
    imageKey: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    subscription: {
      plan: {
        type: mongoose.Schema.ObjectId,
        ref: 'Plan'
      },
      startDate: {
        type: Date,
        default: Date.now
      },
      expiryDate: {
        type: Date
      },
    },
    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subscription" }],
    walkinSalons: [
      {
        type: mongoose.Schema.ObjectId,
      }
    ],
    dues: [
      {
        bookingId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Booking'
        },
        salonId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Salon'
        },
        amount: {
          type: Number
        },
        bookingDate: {
          type: Date
        },
      }
    ],
    convertedAt: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ location: "2dsphere" });

module.exports = new mongoose.model("User", UserSchema);
