"use strict";

const RecordsService = require("./records.service");
const Model = require("../models/organization.model");

class OrganizationsService extends RecordsService {
  constructor() {
    super(Model);
  }
}

module.exports = OrganizationsService;
