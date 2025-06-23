import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', taskRoutes);
app.use('/api', userRoutes);
// Endpoint to register & authenticate a new user
// app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { username, email, password } = req.body;
//         if (!username || !email || !password) {
//             res.status(400).json({ error: 'Username, email, and password are required' });
//             return;
//         }
//         // Check if user exists
//         const existingUser = await pool.query(
//             'SELECT * FROM users WHERE username = $1 OR email = $2',
//             [username, email]
//         );
//         if (existingUser.rows.length > 0) {
//             res.status(400).json({ error: 'User already exists' });
//             return;
//         }
//         const hashedPassword = await bcrypt.hash(password as string, 10);
//         const result = await pool.query(
//             'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
//             [username, email, hashedPassword]
//         );
//         const user = result.rows[0];
//         const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
//         res.status(201).json({
//             token,
//             user: { id: user.id, username: user.username, email: user.email }
//         });
//     } catch (error) {
//         console.error('Error registering user:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
// // Endpoint to authenticate user login
// app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { usernameOrEmail, password } = req.body;
//         const userQuery = await pool.query(
//             'SELECT * FROM users WHERE username = $1 OR email = $2',
//             [usernameOrEmail, usernameOrEmail]
//         );
//         const user = userQuery.rows[0];
//         if (!user) {
//             res.status(401).json({ error: 'Invalid username or email' });
//             return;
//         }
//         const isPasswordValid = await bcrypt.compare(password, user.password_hash);
//         if (!isPasswordValid) {
//             res.status(401).json({ error: 'Invalid password' });
//             return;
//         }
//         const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
//         res.status(200).json({
//              token,
//              user: { id: user.id, username: user.username, email: user.email, lastViewedTasks: user.last_viewed_tasks || [] }
//         });
//     } catch (error) {
//         console.error('Error authenticating user:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
// Endpoint to create a new task
// app.post('/api/tasks', authMiddleware, async (req: Request, res: Response): Promise<void> => {
//   try {
//     const type = req.body;
//     console.log('Received task type:', type);
//     const userId = req.user?.id;
//     console.log('User ID from request:', userId);
//     if (!userId) {
//         res.status(401).json({ error: 'Unauthorized' });
//         return;
//     }
//     if (type.type === 'note') {
//         const noteResult = await pool.query(
//         'INSERT INTO notepads (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
//         ['Untitled Note', '', userId]
//       );
//         res.status(201).json(noteResult.rows[0]);
//     } else if (type.type === 'kanban') {
//       // Insert into kanbans
//       const kanbanResult = await pool.query(
//         'INSERT INTO kanbans (title, user_id) VALUES ($1, $2) RETURNING *',
//         ['Untitled Kanban', userId]
//       );
//       res.status(201).json(kanbanResult.rows[0]);
//     } else if (type.type === 'list') {
//       // Insert into lists
//       const listResult = await pool.query(
//         'INSERT INTO lists (title, user_id) VALUES ($1, $2) RETURNING *',
//         ['Untitled List', userId]
//       );
//       res.status(201).json(listResult.rows[0]);
//     } else {
//         res.status(400).json({ error: 'Invalid task type' });
//         return;
//     }
//   } catch (error) {
//     console.error('Error creating task:', error);
//     res.status(500).json({ error: 'Failed to create task' });
//   }
// });
// Endpoint to fetch tasks
// app.get('/api/tasks/fetch', authMiddleware, async (req: Request, res: Response): Promise<void> => {
//     const userId = req.user?.id;
//     if (!userId) {
//         res.status(401).json({ error: 'Unauthorized' });
//         return;
//     }
//     try {
//         const notepadsResult = await pool.query(
//             'SELECT *, \'note\' as type FROM notepads WHERE user_id = $1',
//             [userId]
//         );
//         const notepads = notepadsResult.rows;
//         // console.log('Fetched notepads:', notepads);
//         const notepadIds = notepads.map(notepad => notepad.id);
//         let tagsForNotepad: Record<string, string[]> = {};
//         if (notepadIds.length > 0) {
//             const tagsResult = await pool.query(
//                 'SELECT notepad_id, tag_id FROM notepad_tags WHERE notepad_id = ANY($1)',
//                 [notepadIds]
//             )
//             tagsForNotepad = tagsResult.rows.reduce((accumulator: Record<string, string[]>, row) => {
//                 if (!accumulator[row.notepad_id]) {
//                     accumulator[row.notepad_id] = [];
//                 }
//                 accumulator[row.notepad_id].push(row.tag_id);
//                 return accumulator;
//             }, {});
//         }
//         const notepadsWithTags = notepads.map(notepad => ({
//             ...notepad,
//             tags: tagsForNotepad[notepad.id] || []
//         }));
//         // console.log('Notepads with tags:', notepadsWithTags);
//         res.status(200).json({
//             notepads: notepadsWithTags,
//         });
//     } catch (error) {
//         console.error('Error fetching tasks:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })
// Endpoint to edit a task
// app.put('/api/tasks/edit/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
//     const taskId = req.params.id;
//     const { title, content } = req.body;
//     const userId = req.user?.id;
//     if (!userId) {
//         res.status(401).json({ error: 'Unauthorized' });
//         return;
//     }
//     try {
//         const result = await pool.query(
//             'UPDATE notepads SET title = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
//             [title, content, taskId, userId]
//         );
//         if (result.rows.length === 0) {
//             res.status(404).json({ error: 'Task not found' });
//             return;
//         }
//         res.status(200).json(result.rows[0]);
//     } catch (error) {
//         console.error('Error updating task:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
// Endpoint to assign a tag to a task
// app.post('/api/tasks/:id/tags', authMiddleware, async (req: Request, res: Response): Promise<void> => {
//     const { id, tag } = req.body;
// })
// Endpoint to update the last viewed tasks
// app.put('/api/user/last-viewed', authMiddleware, async (req: Request, res: Response): Promise<void> => {
//     const userId = req.user?.id;
//     const lastViewed = req.body.lastViewedTasks;
//     if (!Array.isArray(lastViewed) || lastViewed.length > 10) {
//         res.status(400).json({ error: 'Last viewed must be an array of up to 10 task IDs' });
//         return;
//     }
//     if (!userId) {
//         res.status(401).json({ error: 'Unauthorized' });
//         return;
//     }
//     try {
//         const historyResult = await pool.query(
//             'UPDATE users SET last_viewed_tasks = $1 WHERE id = $2 RETURNING last_viewed_tasks',
//             [lastViewed, userId]
//         );
//         console.log('Updated last viewed tasks:', historyResult.rows[0].last_viewed_tasks);
//         res.status(200).json({
//             lastViewedTasks: historyResult.rows[0].last_viewed_tasks});
//     } catch (error) {
//         console.error('Error fetching user history:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });
const PORT = 5006;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
