const mongoose = require("mongoose");

// Schema for Artists
const ArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      set: v => v.toLowerCase(),
    },
    rating: {
      type: Number,
      default: 0,
      set: v => v.toFixed(2)
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
        variables: [
          {
            variableId: String,
            price: {
              type: Number,
              set: v => v.toFixed(2)
            }
          }
        ],
        price: {
          type: Number,
          required: true,
          set: v => v.toFixed(2)
        },
      },
    ],
    targetGender: {
      type: String,
      enum: ["unisex", "male", "female", "not specified"],
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
    },
    paid: {
      type: Boolean,
      default: false
    },
    bookings: {
      type: Number,
      default: 0
    }, 
    links: {
      instagram: {
          type: String,
          default: ''
      }
    },
    imageKey: {
      type: String,
      default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    }
  },
  {
    timestamps: true,
  }
);

ArtistSchema.index({ location: "2dsphere" });
module.exports = new mongoose.model("Artist", ArtistSchema);
