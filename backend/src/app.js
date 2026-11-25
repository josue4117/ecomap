"use strict";

const express = require("express");
const cors = require("cors");
const routerApi = require("./routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.handler");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));
routerApi(app);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
