const mongoose = require("mongoose");

const aiKnowledgeSchema = new mongoose.Schema(
  {
    keywords: {
      type: [String],
      required: true,
      lowercase: true,
    },
    conditions: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    specialist: {
      type: String,
      required: true,
    },
    tips: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIKnowledge", aiKnowledgeSchema);
