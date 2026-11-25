"use strict";

const RecordsService = require("./records.service");
const Category = require("../models/category.model");
const Location = require("../models/location.model");
const AppError = require("../utils/appError");

class CategoriesService extends RecordsService {
  constructor() {
    super(Category);
  }

  async delete(owner, id) {
    if (await Location.exists({ owner, category: id })) {
      throw new AppError("La categoría está en uso. Cambia la categoría de sus ubicaciones primero.", 400);
    }
    await super.delete(owner, id);
  }
}

module.exports = CategoriesService;
