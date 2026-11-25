"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const connectDatabase = require("./config/database");

async function start() {
  if ((process.env.JWT_SECRET || "").length < 32) {
    throw new Error("Configura JWT_SECRET con al menos 32 caracteres");
  }
  await connectDatabase();
  const port = process.env.PORT || 3000;
  await new Promise((resolve, reject) => {
    app.listen(port, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  console.log("API EcoMapa disponible en el puerto " + port);
}

start().catch(async (error) => {
  console.error(error.message);
  process.exitCode = 1;
  await mongoose.disconnect();
});
