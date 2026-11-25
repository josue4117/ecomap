"use strict";

const mongoose = require("mongoose");
const AppError = require("../utils/appError");

const statuses = ["Activo", "Temporalmente cerrado"];
const isPoint = (point) => Array.isArray(point) && point.length === 2 &&
  point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;

function text(value, label, max) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new AppError(`${label} es obligatorio y admite hasta ${max} caracteres`, 400);
  }
  return value.trim();
}

function validateId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) throw new AppError("Identificador inválido", 400);
  return id;
}

function polygon(geometry) {
  const ring = geometry?.coordinates?.[0];
  if (geometry?.type !== "Polygon" || geometry.coordinates.length !== 1 ||
      !Array.isArray(ring) || ring.length < 4 || ring.length > 201 ||
      !ring.every(isPoint) || String(ring[0]) !== String(ring.at(-1)) ||
      new Set(ring.slice(0, -1).map(String)).size !== ring.length - 1) {
    throw new AppError("Dibuja un polígono cerrado con 3 a 200 vértices distintos", 400);
  }

  const area = ring.slice(1).reduce((sum, [x, y], index) =>
    sum + ring[index][0] * (y - ring[0][1]) - x * (ring[index][1] - ring[0][1]), 0);
  if (Math.abs(area) < 1e-12) throw new AppError("La zona debe encerrar una superficie", 400);
  return { type: "Polygon", coordinates: [area > 0 ? ring : ring.slice().reverse()] };
}

const schemas = {
  catalog: (body) => ({
    name: text(body.name, "El nombre", 100),
    description: text(body.description, "La descripción", 500),
  }),
  location: (body) => {
    if (!statuses.includes(body.status)) throw new AppError("Selecciona un estado válido", 400);
    if (body.geometry?.type !== "Point" || !isPoint(body.geometry.coordinates)) {
      throw new AppError("Selecciona una ubicación válida en el mapa", 400);
    }
    return {
      ...schemas.catalog(body),
      category: validateId(body.category),
      status: body.status,
      geometry: { type: "Point", coordinates: body.geometry.coordinates },
    };
  },
  zone: (body) => ({ name: text(body.name, "El nombre", 100), geometry: polygon(body.geometry) }),
};

function credentials(body, register) {
  const email = text(body.email, "El correo", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Ingresa un correo válido", 400);
  if (typeof body.password !== "string" || Buffer.byteLength(body.password) > 72 ||
      body.password.length < (register ? 8 : 1)) {
    throw new AppError(register ? "Usa al menos 8 caracteres y hasta 72 bytes para la contraseña" : "Contraseña inválida", 400);
  }
  return { email, password: body.password, ...(register && { name: text(body.name, "El nombre", 100) }) };
}

function validatePayload(schema) {
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AppError("Envía un objeto JSON válido", 400);
    req.payload = schema(body);
    next();
  };
}

function locationFilters(query) {
  const filters = {};
  if (query.search) {
    const search = text(query.search, "La búsqueda", 100);
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.name = new RegExp(escaped, "i");
  }
  if (query.category) filters.category = validateId(query.category);
  if (query.status) {
    if (!statuses.includes(query.status)) throw new AppError("Estado inválido", 400);
    filters.status = query.status;
  }
  return filters;
}

module.exports = { schemas, credentials, validatePayload, validateId, locationFilters };
