"use strict";

const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error("Configura MONGODB_URI en .env");
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = connectDatabase;
