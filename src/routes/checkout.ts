import { Router } from 'express';
import { checkoutHandler } from '../controllers/checkout';
import { validateUser } from '../middlewares/validateUser';

const router = Router();

router.post('/:userId', validateUser, checkoutHandler);

export default router;
