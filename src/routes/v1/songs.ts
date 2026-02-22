import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validateRequest } from '../../middleware/validateRequest.ts';
import * as songService from '../../services/songService.ts';
import { z } from 'zod';

const router = Router();

// Validation schemas
const listSongsQuery = z.object({
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
router.get('/', validateRequest({ query: listSongsQuery }), async (req, res, next) => {
  try {
    const result = await songService.listSongs(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

// IMPORTANT: POST /lookup must be defined BEFORE GET /:songId
// so that 'lookup' is not parsed as a songId parameter
router.post('/lookup', requireAuth, validateRequest({ body: lookupSongsBody }), async (req, res, next) => {
  try {
    const result = await songService.lookupSongs(req.body.titles);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:songId', validateRequest({ params: songIdParam }), async (req, res, next) => {
  try {
    const result = await songService.getSong(Number(req.params.songId));
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
