import { Router } from 'express';
const router = Router();
import { signup, login, logout, validateSession } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate-session', auth, validateSession);

export default router; 