"use strict";

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

schema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", schema);
