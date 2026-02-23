import { Router } from 'express';
import * as statsService from '../../services/statsService.ts';

const router = Router();

router.get('/', async (req, res) => {
  const result = await statsService.getStats();
  res.json({ data: result });
});

export default router;
