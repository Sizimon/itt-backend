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
        const notepadIds = notepads.map(notepad => notepad.id);
        if (notepadIds.length > 0) {
            const tagsResult = await pool.query(`SELECT nt.notepad_id, t.id as id, t.title, t.color
                FROM notepad_tags nt
                JOIN tags t ON nt.tag_id = t.id
                WHERE nt.notepad_id = ANY($1::int[]) AND t.user_id = $2`, [notepadIds, userId]);
            let tagsForNotepad = {};
            tagsResult.rows.forEach(row => {
                if (!tagsForNotepad[row.notepad_id]) {
                    tagsForNotepad[row.notepad_id] = [];
                }
                tagsForNotepad[row.notepad_id].push({
                    id: row.id,
                    title: row.title,
                    color: row.color
                });
            });
            const notepadsWithTags = notepads.map(notepad => ({
                ...notepad,
                tags: tagsForNotepad[notepad.id] || []
            }));
            // console.log('Notepads with tags:', notepadsWithTags);
            res.status(200).json({
                notepads: notepadsWithTags,
            });
        }
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
    // Check the request body for valid fields to update
    const allowedFields = ['title', 'content', 'is_favorite'];
    // Store updates and values for the query
    const updates = [];
    const values = [];
    // Start parameter index at 1 for PostgreSQL
    // PostgreSQL uses $1, $2, etc. for parameterized queries
    let paramIndex = 1;
    // Iterate over allowed fields and check if they are present in the request body
    for (const field of allowedFields) {
        if (field in req.body) {
            updates.push(`${field} = $${paramIndex}`); // Push the string for the update
            values.push(req.body[field]); // Push the value to the values array
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
router.post('/tasks/:taskId/tags', async (req, res) => {
    const { title, color } = req.body;
    const taskId = req.params.taskId;
    const userId = req.user?.id;
    console.log('Adding tag:', { title, color }, 'to task ID:', taskId, 'for user ID:', userId);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const tagResult = await pool.query(`INSERT INTO tags (title, color, user_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (title, color) DO UPDATE SET title = EXCLUDED.title
            RETURNING id, title, color`, [title, color, userId]);
        const tagId = tagResult.rows[0].id;
        console.log('Tag created or updated:', tagResult.rows[0]);
        const notepadTagsResult = await pool.query('INSERT INTO notepad_tags (notepad_id, tag_id) VALUES ($1, $2) RETURNING *', [taskId, tagId]);
        console.log('Notepad tag correlation created:', notepadTagsResult.rows[0]);
        res.status(201).json({
            tag: tagResult.rows[0],
            notepad_tag: notepadTagsResult.rows[0]
        });
    }
    catch (error) {
        console.error('Error adding tag to task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/tasks/:id/tags/:tagId', async (req, res) => {
    const taskId = req.params.id;
    const tagId = req.params.tagId;
    const userId = req.user?.id;
    console.log('Removing tag ID:', tagId, 'from task ID:', taskId, 'for user ID:', userId);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const result = await pool.query('DELETE FROM notepad_tags WHERE notepad_id = $1 AND tag_id = $2 RETURNING *', [taskId, tagId]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Tag not found for this task' });
            return;
        }
        res.status(200).json({ message: 'Tag removed from task successfully' });
    }
    catch (error) {
        console.error('Error removing tag from task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
