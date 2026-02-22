import { Router } from 'express';
import showRoutes from './shows.ts';
import songRoutes from './songs.ts';
import venueRoutes from './venues.ts';
import statsRoutes from './stats.ts';

const router = Router();

router.use('/shows', showRoutes);
router.use('/songs', songRoutes);
router.use('/venues', venueRoutes);
router.use('/stats', statsRoutes);

export default router;
