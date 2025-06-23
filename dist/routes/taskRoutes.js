import { Router } from 'express';
import { authMiddleware } from '../AuthMiddleware.js';
import pool from '../db/dbConnection.js';
const router = Router();
router.use(authMiddleware);
// Endpoint to create a new task (notepad, kanban, or list)
// This endpoint expects a JSON body with a "type" field indicating the type of task to create.
// The "type" can be 'note', 'kanban', or 'list'.
router.post('/tasks', async (req, res) => {
    try {
        const type = req.body;
        console.log('Received task type:', type);
        const userId = req.user?.id;
        console.log('User ID from request:', userId);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (type.type === 'note') {
            const noteResult = await pool.query('INSERT INTO notepads (title, content, user_id) VALUES ($1, $2, $3) RETURNING *', ['Untitled Note', '', userId]);
            res.status(201).json(noteResult.rows[0]);
        }
        else {
            res.status(400).json({ error: 'Invalid task type' });
            return;
        }
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
router.get('/tasks/fetch', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const notepadsResult = await pool.query('SELECT *, \'note\' as type FROM notepads WHERE user_id = $1', [userId]);
        const notepads = notepadsResult.rows;
        // console.log('Fetched notepads:', notepads);
        const notepadIds = notepads.map(notepad => notepad.id);
        let tagsForNotepad = {};
        if (notepadIds.length > 0) {
            const tagsResult = await pool.query('SELECT notepad_id, tag_id FROM notepad_tags WHERE notepad_id = ANY($1)', [notepadIds]);
            tagsForNotepad = tagsResult.rows.reduce((accumulator, row) => {
                if (!accumulator[row.notepad_id]) {
                    accumulator[row.notepad_id] = [];
                }
                accumulator[row.notepad_id].push(row.tag_id);
                return accumulator;
            }, {});
        }
        const notepadsWithTags = notepads.map(notepad => ({
            ...notepad,
            tags: tagsForNotepad[notepad.id] || []
        }));
        // console.log('Notepads with tags:', notepadsWithTags);
        res.status(200).json({
            notepads: notepadsWithTags,
        });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/tasks/edit/:id', async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const allowedFields = ['title', 'content', 'is_favorite'];
    const updates = [];
    const values = [];
    let paramIndex = 1;
    for (const field of allowedFields) {
        if (field in req.body) {
            updates.push(`${field} = $${paramIndex}`);
            values.push(req.body[field]);
            paramIndex++;
        }
    }
    if (updates.length === 0) {
        res.status(400).json({ error: 'No valid fields to update' });
        return;
    }
    // Add taskId and userId to the values array
    values.push(taskId, userId);
    const query = `
        UPDATE notepads
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
    `;
    console.log('Executing query:', query);
    console.log('With values:', values);
    try {
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/tasks/:id/tags', async (req, res) => {
    const { id, tag } = req.body;
});
export default router;
