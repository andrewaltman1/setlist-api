import express, { Request, Response } from "express";
const router = express.Router();
import db from "../db";
import { catchAsync } from "../utils";

router.get(
    "/songs",
    catchAsync(async (req, res) => {
        let songs = await db.getAllSongs(req);
        res.json(songs);
    })
);

router.get(
    "/songs/author/:author",
    catchAsync(async (req, res) => {
      let { rows } = await db.getAllSongsByAuthor(req.params.author);
      res.json(rows);
    })
  );
  
  router.get(
    "/song/:id",
    catchAsync(async (req, res) => {
      let { rows } = await db.getSongByID(req.params.id);
      res.json(rows);
    })
  );
  
export default router;