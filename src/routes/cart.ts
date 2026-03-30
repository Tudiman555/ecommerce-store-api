import { Router } from 'express';
import { addItem, getCartHandler } from '../controllers/cart';

const router = Router();

// TODO: user id can be extracted from token for simplicity added it
// Right now we can only add a single product at a time
router.post('/:userId/items', addItem);
router.get('/:userId', getCartHandler);

export default router;
