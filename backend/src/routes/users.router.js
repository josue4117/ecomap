"use strict";

const express = require("express");
const UsersService = require("../services/users.service");
const requireAuth = require("../middlewares/auth");
const { credentials, profile, validatePassword, validatePayload } = require("../middlewares/validator");

const router = express.Router();
const service = new UsersService();

router.post("/register", validatePayload((body) => credentials(body, true)), async (req, res) => {
  res.status(201).json({ data: await service.register(req.payload) });
});

router.post("/login", validatePayload((body) => credentials(body, false)), async (req, res) => {
  res.status(200).json({ data: await service.login(req.payload) });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ data: await service.getProfile(req.userId) });
});

router.put("/me", requireAuth, validatePayload(profile), async (req, res) => {
  res.json({ data: await service.updateProfile(req.userId, req.payload), message: "Perfil actualizado" });
});

router.delete("/me", requireAuth, validatePayload((body) => validatePassword(body.password)), async (req, res) => {
  await service.deleteProfile(req.userId, req.payload);
  res.json({ message: "Cuenta eliminada" });
});

module.exports = router;
