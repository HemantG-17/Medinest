const mongoose = require("mongoose");

const unrecognizedQuerySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UnrecognizedQuery", unrecognizedQuerySchema);
