"use strict";

const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"], required: true },
  coordinates: { type: [Number], required: true },
}, { _id: false });

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  status: { type: String, enum: ["Activo", "Temporalmente cerrado"], required: true },
  geometry: { type: pointSchema, required: true },
}, { timestamps: true });

schema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Location", schema);
