"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/appError");

class UsersService {
  session(user) {
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user._id), expiresIn: "8h" });
    return { token, user: { name: user.name, email: user.email } };
  }

  async register({ name, email, password }) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return this.session(user);
  }

  async login({ email, password }) {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new AppError("Correo o contraseña incorrectos", 401);
    }
    return this.session(user);
  }
}

module.exports = UsersService;
