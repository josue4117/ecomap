"use strict";

const express = require("express");
const { validateId, validatePayload } = require("../middlewares/validator");

function recordsRouter(service, schema, filters = () => ({})) {
  const router = express.Router();

  router.param("id", (req, res, next, id) => {
    validateId(id);
    next();
  });

  router.get("/", async (req, res) => {
    const data = await service.getAll(req.userId, filters(req.query));
    res.status(200).json({ count: data.length, data });
  });

  router.get("/:id", async (req, res) => {
    const data = await service.getById(req.userId, req.params.id);
    res.status(200).json({ data });
  });

  router.post("/", validatePayload(schema), async (req, res) => {
    const data = await service.create(req.userId, req.payload);
    res.status(201).json({ data, message: "Registro creado" });
  });

  router.put("/:id", validatePayload(schema), async (req, res) => {
    const data = await service.update(req.userId, req.params.id, req.payload);
    res.status(200).json({ data, message: "Registro actualizado" });
  });

  router.delete("/:id", async (req, res) => {
    await service.delete(req.userId, req.params.id);
    res.status(200).json({ message: "Registro eliminado" });
  });

  return router;
}

module.exports = recordsRouter;
