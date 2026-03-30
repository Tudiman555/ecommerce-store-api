import { Router } from 'express';
import cartRouter from './cart';

const router = Router();

router.use('/cart', cartRouter);


export default router;
