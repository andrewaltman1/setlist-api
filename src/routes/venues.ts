import express from "express";
const router = express.Router();
import db from "../db.ts";
import { catchAsync } from "../utils.ts";

router.get(
  "/venues",
  catchAsync(async (req, res) => {
    const { rows } = await db.getAllVenues(req);
    res.json(rows);
  })
);

router.get(
  "/venues/states/:state",
  catchAsync(async (req, res) => {
    const { rows } = await db.getVenuesByState(req.params.state);
    res.json(rows);
  })
);

router.get(
  "/venues/cities/:city.:state",
  catchAsync(async (req, res) => {
    const { rows } = await db.getVenuesByCity(req.params.city, req.params.state);
    res.json(rows)
  })
);

router.get(
  "/venues/:id",
  catchAsync(async (req, res) => {
    const { rows } = await db.getVenueByID(req.params.id);
    res.json(rows)
  })
);


export default router;