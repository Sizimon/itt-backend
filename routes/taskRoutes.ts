import { Router, Request, Response } from 'express';
import { authMiddleware } from '../AuthMiddleware.js';
import pool from '../db/dbConnection.js';

const router = Router();
router.use(authMiddleware);
// Endpoint to create a new task (notepad, kanban, or list)
// This endpoint expects a JSON body with a "type" field indicating the type of task to create.
// The "type" can be 'note', 'kanban', or 'list'.

router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
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
        const noteResult = await pool.query(
        'INSERT INTO notepads (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
        ['Untitled Note', '', userId]
      );
        res.status(201).json(noteResult.rows[0]);
    } else {
        res.status(400).json({ error: 'Invalid task type' });
        return;
    }
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/tasks/fetch', async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const notepadsResult = await pool.query(
            'SELECT *, \'note\' as type FROM notepads WHERE user_id = $1',
            [userId]
        );
        const notepads = notepadsResult.rows;
        // console.log('Fetched notepads:', notepads);
        
        const notepadIds = notepads.map(notepad => notepad.id);
        let tagsForNotepad: Record<string, string[]> = {};
        if (notepadIds.length > 0) {
            const tagsResult = await pool.query(
                'SELECT notepad_id, tag_id FROM notepad_tags WHERE notepad_id = ANY($1)',
                [notepadIds]
            )
            tagsForNotepad = tagsResult.rows.reduce((accumulator: Record<string, string[]>, row) => {
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
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.put('/tasks/edit/:id', async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const { title, content } = req.body;

    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const result = await pool.query(
            'UPDATE notepads SET title = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [title, content, taskId, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/tasks/:id/tags', async (req: Request, res: Response): Promise<void> => {
    const { id, tag } = req.body;
})

export default router;
