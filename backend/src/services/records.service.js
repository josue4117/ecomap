"use strict";

const AppError = require("../utils/appError");

class RecordsService {
  constructor(model) {
    this.model = model;
  }

  query(records) {
    return records.select("-owner -__v");
  }

  getAll(owner, filters = {}) {
    return this.query(this.model.find({ ...filters, owner }).sort({ name: 1, _id: 1 })).lean();
  }

  async getById(owner, id) {
    const record = await this.query(this.model.findOne({ owner, _id: id })).lean();
    if (!record) throw new AppError("Registro no encontrado", 404);
    return record;
  }

  async create(owner, payload) {
    const record = await this.model.create({ ...payload, owner });
    return this.getById(owner, record._id);
  }

  async update(owner, id, payload) {
    const record = await this.query(this.model.findOneAndUpdate(
      { owner, _id: id }, payload, { new: true, runValidators: true }
    )).lean();
    if (!record) throw new AppError("Registro no encontrado", 404);
    return record;
  }

  async delete(owner, id) {
    const record = await this.model.findOneAndDelete({ owner, _id: id });
    if (!record) throw new AppError("Registro no encontrado", 404);
  }
}

module.exports = RecordsService;
