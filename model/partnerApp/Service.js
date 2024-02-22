const mongoose = require("mongoose");
const CommonUtils = require("../../helper/commonUtils");

// Schema for Service
const ServiceSchema = new mongoose.Schema(
  {
    salonId: mongoose.Schema.ObjectId,
    category: {
      type: String,
      lowercase: true,
      required: true,
    },
    serviceTitle: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
    targetGender: {
      type: String,
      lowercase: true,
      required: true,
    },
    avgTime: {
      type: Number,
      required: true,
      default: 1,
    },
    productsUsed: [
      {
        product: { type: mongoose.Schema.ObjectId, ref: "Product" },
        usagePerService: Number,
      },
    ],
    variables: [
      {
        variableType: {
          type: String,
          lowercase: true,
          required: true,
        },
        variableName: {
          type: String,
          lowercase: true,
          required: true,
        },
        variablePrice: {
          type: mongoose.Schema.Types.Decimal128,
          required: true,
          default: 0,
          set: (v) => Number(v).toFixed(2),
          get: CommonUtils.getDouble,
        },
        variableCutPrice: {
          type: mongoose.Schema.Types.Decimal128,
          required: true,
          default: 0,
          set: (v) => Number(v).toFixed(2),
          get: CommonUtils.getDouble,
        },
        variableTime: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    basePrice: {
      type: mongoose.Schema.Types.Decimal128,
      set: (v) => Number(v).toFixed(2),
      get: CommonUtils.getDouble,
    },
    cutPrice: {
      type: mongoose.Schema.Types.Decimal128,
      set: (v) => Number(v).toFixed(2),
      get: CommonUtils.getDouble,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: false},
  }
);

module.exports = new mongoose.model("Service", ServiceSchema);
