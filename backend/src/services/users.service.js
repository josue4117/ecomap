"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Category = require("../models/category.model");
const Material = require("../models/material.model");
const Organization = require("../models/organization.model");
const Location = require("../models/location.model");
const Zone = require("../models/zone.model");
const AppError = require("../utils/appError");

class UsersService {
  async getProfile(id) {
    const user = await User.findById(id);
    if (!user) throw new AppError("Cuenta no encontrada", 404);
    return { name: user.name, email: user.email };
  }

  async verifyPassword(id, password) {
    const user = await User.findById(id).select("+passwordHash");
    if (!user) throw new AppError("Cuenta no encontrada", 404);
    if (!await bcrypt.compare(password, user.passwordHash)) throw new AppError("La contraseña actual es incorrecta", 400);
    return user;
  }

  async updateProfile(id, { name, email, currentPassword, password }) {
    const user = await this.verifyPassword(id, currentPassword);
    user.set({ name, email });
    if (password) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    return { name: user.name, email: user.email };
  }

  async deleteProfile(id, password) {
    const user = await this.verifyPassword(id, password);
    for (const Model of [Location, Zone, Category, Material, Organization]) {
      await Model.deleteMany({ owner: user._id });
    }
    await user.deleteOne();
  }

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
