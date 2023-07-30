import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { catchAsync } from "../utils";

router.get(
    "/shows",
    catchAsync(async (req, res) => {
        let shows = await db.getAllShows(req);
        res.json(shows);
    })
);


router.get(
    "/shows/song/:songid",
    catchAsync(async (req, res) => {
        let { rows } = await db.getShowsBySongID(req.params.songid);
        res.json(rows);
    })
);

router.get(
    "/show/:id",
    catchAsync(async (req, res) => {
        let { rows } = await db.getShowByID(req.params.id);
        res.json(rows);
    })
);

router.get(
    "/show/date/:date",
    catchAsync(async (req, res) => {
        let { rows } = await db.getShowByDate(req.params.date);
        res.json(rows);
    })
);

export default router;
