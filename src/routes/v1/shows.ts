import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validateRequest } from '../../middleware/validateRequest.ts';
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
router.get('/', validateRequest({ query: listShowsQuery }), async (req, res, next) => {
  try {
    const result = await showService.listShows(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, validateRequest({ body: createShowBody }), async (req, res, next) => {
  try {
    const result = await showService.createShow(req.body, req.user!.id);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:showId', validateRequest({ params: showIdParam }), async (req, res, next) => {
  try {
    const result = await showService.getShow(Number(req.params.showId));
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
