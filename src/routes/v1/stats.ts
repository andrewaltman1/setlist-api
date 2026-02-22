import { Router } from 'express';
import * as statsService from '../../services/statsService.ts';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await statsService.getStats();
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
