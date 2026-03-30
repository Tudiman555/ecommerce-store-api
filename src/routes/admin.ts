import { Router } from 'express';
import { generateDiscountCodeHandler, getStatsHandler } from '../controllers/admin';

const router = Router();

// In a real app these would be protected by admin-role middleware
router.post('/discount-codes/generate', generateDiscountCodeHandler);
router.get('/stats', getStatsHandler);

export default router;
