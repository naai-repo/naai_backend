const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema(
  {
    key: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Urls = mongoose.model("Url", UrlSchema);
module.exports = Urls;
