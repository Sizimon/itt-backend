import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
const JWTs_SECRET = Math.random().toString(36).substring(7);
const PORT = 5006;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
