const mongoose = require("mongoose");

// Schema for Artists
const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    salonId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    services: [
      {
        serviceId: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    targetGender: {
      type: String,
      enum: ["unisex", "men", "women", "not specified"],
      default: "not specified",
      lowercase: true,
      required: true
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
    timing: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true
      }
    },
    offDay: [ {
      type: String,
      required: true
    } ],
    availability: {
      type: Boolean,
      default: true
    },
    live: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

ArtistSchema.index({ location: "2dsphere" });
module.exports = new mongoose.model("Artist", ArtistSchema);
