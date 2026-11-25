"use strict";

const RecordsService = require("./records.service");
const Location = require("../models/location.model");
const Category = require("../models/category.model");
const AppError = require("../utils/appError");

class LocationsService extends RecordsService {
  constructor() {
    super(Location);
  }

  query(records) {
    return super.query(records).populate("category", "name");
  }

  async checkCategory(owner, payload) {
    if (!await Category.exists({ owner, _id: payload.category })) {
      throw new AppError("Selecciona una categoría de tu cuenta", 400);
    }
  }

  async create(owner, payload) {
    await this.checkCategory(owner, payload);
    return super.create(owner, payload);
  }

  async update(owner, id, payload) {
    await this.checkCategory(owner, payload);
    return super.update(owner, id, payload);
  }
}

module.exports = LocationsService;
