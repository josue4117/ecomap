"use strict";

const AppError = require("../utils/appError");

function notFoundHandler(req, res, next) {
  next(new AppError("Ruta no encontrada", 404));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.statusCode || 500;
  let message = error.message;

  if (error.code === 11000) {
    status = 400;
    message = "Ya existe un registro con ese correo o nombre";
  }

  if (["ValidationError", "CastError", "StrictModeError"].includes(error.name) || error.code === 16755) {
    status = 400;
    message = "Los datos o la geometría no son válidos";
  }

  if (status >= 500) {
    console.error(error.message);
    message = "Error interno del servidor";
  }

  res.status(status).json({ message });
}

module.exports = { notFoundHandler, errorHandler };
