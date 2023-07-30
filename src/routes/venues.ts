import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { catchAsync } from "../utils";

router.get(
    "/venues",
    catchAsync(async (req, res) => {
        let venues = await db.getAllVenues(req);
        res.json(venues);
    })
);

router.get(
    "/venues/state/:state",
    catchAsync(async (req, res) => {
      let { rows } = await db.getVenuesByState(req.params.state);
      res.json(rows);
    })
  );
  
  router.get(
    "/venues/city/:city.:state",
    catchAsync(async (req, res) => {
      let { rows } = await db.getVenuesByCity(req.params.city, req.params.state);
      res.json(rows)
    })
  );
  
  router.get(
    "/venue/:id",
    catchAsync(async (req, res) => {
      let { rows } = await db.getVenueByID(req.params.id);
      res.json(rows)
    })
  );

  
export default router;