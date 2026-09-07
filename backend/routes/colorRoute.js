import express from 'express';
import { addColor, listColors, removeColor } from '../controllers/colorController.js';
import adminAuth from '../middleware/adminAuth.js';

const colorRouter = express.Router();

colorRouter.post('/add', adminAuth, addColor);
colorRouter.get('/list', listColors);
colorRouter.post('/remove', adminAuth, removeColor);

export default colorRouter;
