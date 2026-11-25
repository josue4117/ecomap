"use strict";

const RecordsService = require("./records.service");
const Model = require("../models/material.model");

class MaterialsService extends RecordsService {
  constructor() {
    super(Model);
  }
}

module.exports = MaterialsService;
