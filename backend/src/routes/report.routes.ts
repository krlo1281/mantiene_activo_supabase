
import { Router } from 'express';
import { getMonthlyReport, getAssignmentHistory } from '../controllers/report.controller.js';

const router = Router();

router.get('/monthly', getMonthlyReport);
router.get('/history', getAssignmentHistory);

export default router;
