import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import * as showService from '../../services/showService.ts';
import { z } from 'zod';

const router = Router();

// Validation schemas
const listShowsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['date', 'venue']).default('date'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  songId: z.coerce.number().int().optional(),
  venueId: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
  state: z.string().optional(),
});

const createShowBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  venueId: z.number().int(),
  notes: z.string().nullable().optional(),
  songs: z.array(z.object({
    songId: z.number().int(),
    position: z.number().int(),
    setNumber: z.string(),
    transition: z.boolean().default(false),
    versionNotes: z.string().nullable().optional(),
  })),
});

const showIdParam = z.object({
  showId: z.coerce.number().int(),
});

// Routes
router.get('/', async (req, res, next) => {
  try {
    const query = listShowsQuery.parse(req.query);
    const result = await showService.listShows(query);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createShowBody.parse(req.body);
    const result = await showService.createShow(body, req.user!.id);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:showId', async (req, res, next) => {
  try {
    const { showId } = showIdParam.parse(req.params);
    const result = await showService.getShow(showId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
