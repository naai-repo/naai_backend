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
    artistServiceMap: [
      {
        artistId: {
          type: mongoose.Schema.ObjectId,
          required: true,
        },
        serviceId: {
          type: mongoose.Schema.ObjectId,
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
