const mongoose = require("mongoose");

// Schema for Salon
const SalonSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
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
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    salonType: {
      type: String,
      enum: ["unisex", "male", "female", "not specified"],
      default: "not specified",
      lowercase: true,
      required: true,
    },
    smsCredits: { type: Number, default: 0 }, 
    timing: {
      opening: {
        type: String,
        required: true,
      },
      closing: {
        type: String,
        required: true,
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    closedOn: {
      type: String,
      default: "none",
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
    owner: {
      type: String,
      required: true,
      lowercase: true,
    },
    gst: {
      type: String,
      default: "XX-XXXXXXXXX-XX",
    },
    pan: {
      type: String,
      default: "XX-XXXXXXXXX-XX",
    },
    live: {
      type: Boolean,
      default: false,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    bookings: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountTime: {
      start: {
        type: String,
        default: "",
      },
      end: {
        type: String,
        default: "",
      },
    },
    links: {
      instagram: {
        type: String,
        default: "",
      },
    },
    logo: {
      key: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      }
    },
    images: [
      {
        key: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    referrer: {
      referrerId: {
        type: mongoose.Schema.ObjectId,
        default: process.env.NULL_OBJECT_ID,
      },
      referralCode: {
        type: String,
        default: "",
      },
    },
    tagsForUsers: [
      {
        title: {
          type: String
        },
        color: {
          type: String
        }
      }
    ],
    userTags: [
      {
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        tags: [
          {type: String}
        ]
      }
    ],
    subscription: {
      planId: {
        type: mongoose.Schema.ObjectId,
        default: process.env.NULL_OBJECT_ID,
      },
      planName: {
        type: String,
        default: "",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: Date.now,
      },
      renewed: {
        type: Boolean,
        default: false,
      },
      features: [],
    },
    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subscription" }], // Reference to Subscriptions
    memberships: [{ type: mongoose.Schema.Types.ObjectId, ref: "Membership" }] 
    ,
    WalkinUsers: [
      {
        type: String,
      },
    ],
    taxIncluded: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
    toJSON: { getters: true, virtuals: false },
  }
);

SalonSchema.index({ location: "2dsphere" });

module.exports = new mongoose.model("Salon", SalonSchema);
