import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
        type: String,
        trim: true,
        default: '',
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
        type: String,
        enum: ['TODO', 'IN_PROGRESS', 'DONE'],
        default: 'TODO',
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM',
    },
    priorityScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
    },
    owner: {
        type: String,
        trim: true,
        default: '',
    },
    dueDate: {
        type: Date,
        default: null,
    },
    createdVia: {
        type: String,
        default: 'ai_chat',
    },
    tags: {
        type: [String],
        default: [],
        index: true,
    },
}, {
    timestamps: true,
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
