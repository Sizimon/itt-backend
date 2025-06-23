import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || Math.random().toString(36).substring(7);
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    // console.error('Auth Header:', authHeader);
    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header is required' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token is required' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId };
        // console.log('Decoded user:', req.user);
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
