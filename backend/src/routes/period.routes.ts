
import { Router } from 'express';
import { getPeriods, createPeriod, updatePeriod, deletePeriod } from '../controllers/period.controller.js';

const router = Router();

router.get('/', getPeriods);
router.post('/', createPeriod);
router.put('/:id', updatePeriod);
router.delete('/:id', deletePeriod);

export default router;
