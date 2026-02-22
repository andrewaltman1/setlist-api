import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validateRequest } from '../../middleware/validateRequest.ts';
import * as venueService from '../../services/venueService.ts';
import { z } from 'zod';

const router = Router();

// Validation schemas
const listVenuesQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['name', 'city', 'state', 'total']).default('name'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  state: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const venueIdParam = z.object({
  venueId: z.coerce.number().int(),
});

const createVenueBody = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
});

// Routes
router.get('/', validateRequest({ query: listVenuesQuery }), async (req, res, next) => {
  try {
    const result = await venueService.listVenues(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, validateRequest({ body: createVenueBody }), async (req, res, next) => {
  try {
    const result = await venueService.createVenue(req.body, req.user!.id);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:venueId', validateRequest({ params: venueIdParam }), async (req, res, next) => {
  try {
    const result = await venueService.getVenue(Number(req.params.venueId));
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
