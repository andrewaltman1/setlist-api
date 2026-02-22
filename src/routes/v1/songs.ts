import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import * as songService from '../../services/songService.ts';
import { z } from 'zod';

const router = Router();

// Validation schemas
export const listSongsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['title', 'author', 'timesPlayed']).default('title'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  author: z.string().optional(),
});

const songIdParam = z.object({
  songId: z.coerce.number().int(),
});

const lookupSongsBody = z.object({
  titles: z.array(z.string()),
});

// Routes
router.get('/', async (req, res, next) => {
  try {
    const query = listSongsQuery.parse(req.query);
    const result = await songService.listSongs(query);
    res.json(result);
  } catch (err) { next(err); }
});

// IMPORTANT: POST /lookup must be defined BEFORE GET /:songId
// so that 'lookup' is not parsed as a songId parameter
router.post('/lookup', requireAuth, async (req, res, next) => {
  try {
    const { titles } = lookupSongsBody.parse(req.body);
    const result = await songService.lookupSongs(titles);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:songId', async (req, res, next) => {
  try {
    const { songId } = songIdParam.parse(req.params);
    const result = await songService.getSong(songId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
