const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    bookingType: {
      type: String,
      required: true,
      lowercase: true,
    },
    salonId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    bookingStatus: {
      type: String,
      required: true,
      enum: ["completed", "pending", "in-progress"],
      lowercase: true,
    },
    paymentStatus: {
      type: String,
      required: true,
    },
    timeSlot: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    coupon: {
      couponId: {
        type: mongoose.Schema.ObjectId,
        default: process.env.NULL_OBJECT_ID,
      },
      couponCode: {
        type: String,
        default: ""
      },
      discount: {
        type: Number,
        default: 0,
      },
      max_value: {
        type: Number,
        default: 0,
      },
      couponDiscount: {
        type: Number,
        default: 0,
      }
    },
    artistServiceMap: [
      {
        artistId: {
          type: mongoose.Schema.ObjectId,
          required: true,
        },
        artistName: {
          type: String,
          required: true,
        },
        serviceId: {
          type: mongoose.Schema.ObjectId,
          required: true,
        },
        serviceCategory: {
          type: String,
          required: true,
        },
        serviceName: {
          type: String,
          required: true,
        },
        variable: {
          variableId: {
            type: String,
            required: true,
          },
          variableType: {
            type: String,
            required: true,
            lowercase: true,
          },
          variableName: {
            type: String,
            required: true,
            lowercase: true,
          },
        },
        servicePrice: {
          type: Number,
          required: true,   
        },
        discountedPrice: {
          type: Number,
          required: true,   
        },
        timeSlot: {
          start: {
            type: String,
            required: true,
          },
          end: {
            type: String,
            required: true,
          },
        },
        chosenBy: {
          type: String,
          required: true,
          enum: ["user", "algo"],
          lowercase: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
