"use strict";

const mongoose = require("mongoose");

const polygonSchema = new mongoose.Schema({
  type: { type: String, enum: ["Polygon"], required: true },
  coordinates: { type: [[[Number]]], required: true },
}, { _id: false });

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  geometry: { type: polygonSchema, required: true },
}, { timestamps: true });

schema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Zone", schema);
