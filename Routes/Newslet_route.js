import express from 'express';
import { sendNewsletter, subscribeNewsletter, getSubscribers} from '../Controllers/Newslet_Con.js';
import { adminOnly, protect } from '../Middleware/auth.js';

const newsLetRoute = express.Router();

// Public
newsLetRoute.post('/subscribe', subscribeNewsletter);

// Admin
newsLetRoute.post('/send', protect, adminOnly, sendNewsletter);

newsLetRoute.get("/subscribers", protect, adminOnly, getSubscribers);


export default newsLetRoute;
