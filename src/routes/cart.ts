import { Router } from 'express';
import { addItemHandler, getCartHandler } from '../controllers/cart';
import { validateUser } from '../middlewares/validateUser';

const router = Router();

// TODO: user id can be extracted from token for simplicity added it
// Right now we can only add a single product at a time
router.post('/:userId/items', validateUser, addItemHandler);
router.get('/:userId', validateUser, getCartHandler);

export default router;
