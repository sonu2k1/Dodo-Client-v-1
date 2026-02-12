import express from 'express';
import Task from '../models/Task.js';
import { getKanbanBoard, moveTaskColumn } from '../services/taskService.js';

const router = express.Router();

/**
 * GET /api/tasks
 * List tasks for the authenticated user
 * Query params: status, priority
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, priority } = req.query;

        const filter = { userId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter).sort({ createdAt: -1 });

        res.json({ tasks, count: tasks.length });
    } catch (error) {
        console.error('GET /api/tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

/**
 * GET /api/tasks/kanban
 * Get tasks grouped by Kanban column (To-Do / In-Progress / Done)
 */
router.get('/kanban', async (req, res) => {
    try {
        const userId = req.user?.id;
        const board = await getKanbanBoard(userId);
        res.json(board);
    } catch (error) {
        console.error('GET /api/tasks/kanban error:', error);
        res.status(500).json({ error: 'Failed to fetch Kanban board' });
    }
});

/**
 * PATCH /api/tasks/:id
 * Update a task (status, priority, title, description)
 */
router.patch('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { status, priority, title, description } = req.body;

        const update = {};
        if (status) update.status = status;
        if (priority) update.priority = priority;
        if (title) update.title = title;
        if (description !== undefined) update.description = description;

        const task = await Task.findOneAndUpdate(
            { _id: id, userId },
            update,
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task });
    } catch (error) {
        console.error('PATCH /api/tasks/:id error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const task = await Task.findOneAndDelete({ _id: id, userId });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/tasks/:id error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
