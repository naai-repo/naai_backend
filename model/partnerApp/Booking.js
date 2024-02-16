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
    }, //Change it as per requirements
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
          },
          variableName: {
            type: String,
            required: true,
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
