"use strict";

const requireAuth = require("../middlewares/auth");
const { schemas, locationFilters } = require("../middlewares/validator");
const recordsRouter = require("./records.router");
const usersRouter = require("./users.router");
const CategoriesService = require("../services/categories.service");
const MaterialsService = require("../services/materials.service");
const OrganizationsService = require("../services/organizations.service");
const LocationsService = require("../services/locations.service");
const ZonesService = require("../services/zones.service");

function routerApi(app) {
  app.use("/api/auth", usersRouter);
  app.use("/api/categories", requireAuth, recordsRouter(new CategoriesService(), schemas.catalog));
  app.use("/api/materials", requireAuth, recordsRouter(new MaterialsService(), schemas.catalog));
  app.use("/api/organizations", requireAuth, recordsRouter(new OrganizationsService(), schemas.catalog));
  app.use("/api/locations", requireAuth, recordsRouter(new LocationsService(), schemas.location, locationFilters));
  app.use("/api/zones", requireAuth, recordsRouter(new ZonesService(), schemas.zone));
}

module.exports = routerApi;
