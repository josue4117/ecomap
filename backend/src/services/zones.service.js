"use strict";

const RecordsService = require("./records.service");
const Model = require("../models/zone.model");

class ZonesService extends RecordsService {
  constructor() {
    super(Model);
  }
}

module.exports = ZonesService;
