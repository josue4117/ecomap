"use strict";

const express = require("express");
const UsersService = require("../services/users.service");
const { credentials, validatePayload } = require("../middlewares/validator");

const router = express.Router();
const service = new UsersService();

router.post("/register", validatePayload((body) => credentials(body, true)), async (req, res) => {
  res.status(201).json({ data: await service.register(req.payload) });
});

router.post("/login", validatePayload((body) => credentials(body, false)), async (req, res) => {
  res.status(200).json({ data: await service.login(req.payload) });
});

module.exports = router;
