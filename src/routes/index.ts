import { Router } from 'express';
import adminRouter from './admin';
import cartRouter from './cart';
import checkoutRouter from './checkout';

const router = Router();

router.use('/cart', cartRouter);
router.use('/checkout', checkoutRouter);
router.use('/admin', adminRouter);

export default router;
