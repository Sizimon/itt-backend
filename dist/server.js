import express from 'express';
import cors from 'cors';
import pool from './db/dbConnection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
const JWT_SECRET = Math.random().toString(36).substring(7);
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Username, email, and password are required' });
            return;
        }
        // Check if user exists
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', [username, email, hashedPassword]);
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const userQuery = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [usernameOrEmail, usernameOrEmail]);
        const user = userQuery.rows[0];
        if (!user) {
            res.status(401).json({ error: 'Invalid username or email' });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const PORT = 5006;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
