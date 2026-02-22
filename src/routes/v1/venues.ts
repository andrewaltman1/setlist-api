import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import * as venueService from '../../services/venueService.ts';
import { z } from 'zod';

const router = Router();

// Validation schemas
export const listVenuesQuery = z.object({
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

export const createVenueBody = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
});

// Routes
router.get('/', async (req, res, next) => {
  try {
    const query = listVenuesQuery.parse(req.query);
    const result = await venueService.listVenues(query);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createVenueBody.parse(req.body);
    const result = await venueService.createVenue(body, req.user!.id);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.get('/:venueId', async (req, res, next) => {
  try {
    const { venueId } = venueIdParam.parse(req.params);
    const result = await venueService.getVenue(venueId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
