"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/appError");

async function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.get("Authorization") || "");
  if (!match) throw new AppError("Inicia sesión para continuar", 401);

  try {
    req.userId = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ["HS256"] }).sub;
  } catch {
    throw new AppError("La sesión expiró o es inválida", 401);
  }

  if (!await User.exists({ _id: req.userId })) throw new AppError("La cuenta no está disponible", 401);
  next();
}

module.exports = requireAuth;
