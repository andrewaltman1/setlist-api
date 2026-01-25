import express from "express";
const router = express.Router();
import db from "../db.ts";
import { catchAsync } from "../utils.ts";

router.get(
  "/songs",
  catchAsync(async (req, res) => {
    const { rows } = await db.getAllSongs(req);
    res.json(rows);
  })
);

router.get(
  "/songs/authors/:author",
  catchAsync(async (req, res) => {
    const { rows } = await db.getAllSongsByAuthor(req.params.author);
    res.json(rows);
  })
);

router.get(
  "/songs/:id",
  catchAsync(async (req, res) => {
    const { rows } = await db.getSongByID(req.params.id);
    res.json(rows);
  })
);

export default router;