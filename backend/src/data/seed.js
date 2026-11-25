"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const User = require("../models/user.model");
const UsersService = require("../services/users.service");
const CategoriesService = require("../services/categories.service");
const MaterialsService = require("../services/materials.service");
const OrganizationsService = require("../services/organizations.service");
const LocationsService = require("../services/locations.service");
const ZonesService = require("../services/zones.service");
const { credentials } = require("../middlewares/validator");

async function ensure(service, owner, payload) {
  const [existing] = await service.getAll(owner, { name: payload.name });
  return existing || service.create(owner, payload);
}

async function seed() {
  if ((process.env.JWT_SECRET || "").length < 32) throw new Error("Configura JWT_SECRET primero");
  const account = credentials({
    name: "Cuenta de revisión",
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
  }, true);

  await connectDatabase();
  const users = new UsersService();
  let user = await User.findOne({ email: account.email });
  if (!user) {
    await users.register(account);
    user = await User.findOne({ email: account.email });
  } else {
    await users.login(account);
  }

  const owner = user._id;
  const categories = new CategoriesService();
  const collection = await ensure(categories, owner, { name: "Centro de acopio", description: "Instalación de recepción de residuos reciclables." });
  const station = await ensure(categories, owner, { name: "Punto temporal", description: "Punto de recolección que opera en campañas." });
  await ensure(new MaterialsService(), owner, { name: "Papel y cartón", description: "Recibe cajas y papel limpios y secos." });
  await ensure(new OrganizationsService(), owner, { name: "Red comunitaria de reciclaje", description: "Organización simulada para la revisión del proyecto." });

  const locations = new LocationsService();
  const samples = [
    ["Centro de acopio Norte", collection, "Activo", [-102.2905, 21.903]],
    ["Punto de reciclaje Alameda", collection, "Activo", [-102.2768, 21.8845]],
    ["Campaña de recolección Centro", station, "Temporalmente cerrado", [-102.2972, 21.8792]],
  ];
  for (const [name, category, status, coordinates] of samples) {
    await ensure(locations, owner, {
      name, category: category._id, status, description: "Ubicación simulada para demostrar EcoMapa.",
      geometry: { type: "Point", coordinates },
    });
  }
  await ensure(new ZonesService(), owner, {
    name: "Cobertura centro",
    geometry: { type: "Polygon", coordinates: [[
      [-102.309, 21.872], [-102.273, 21.872], [-102.273, 21.897], [-102.309, 21.897], [-102.309, 21.872],
    ]] },
  });
  console.log("Datos de revisión preparados");
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
