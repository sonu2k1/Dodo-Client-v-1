import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { CheckCircle2, Clock, AlertTriangle, ArrowUpCircle, ListTodo, User2, Calendar } from 'lucide-react';

/**
 * Priority color and icon mapping
 */
const priorityConfig = {
    LOW: {
        color: 'rgba(100, 200, 100, 0.8)',
        bg: 'rgba(100, 200, 100, 0.1)',
        border: 'rgba(100, 200, 100, 0.25)',
        label: 'Low',
    },
    MEDIUM: {
        color: 'rgba(0, 212, 255, 0.8)',
        bg: 'rgba(0, 212, 255, 0.1)',
        border: 'rgba(0, 212, 255, 0.25)',
        label: 'Medium',
    },
    HIGH: {
        color: 'rgba(255, 170, 0, 0.8)',
        bg: 'rgba(255, 170, 0, 0.1)',
        border: 'rgba(255, 170, 0, 0.25)',
        label: 'High',
    },
    URGENT: {
        color: 'rgba(255, 70, 70, 0.8)',
        bg: 'rgba(255, 70, 70, 0.1)',
        border: 'rgba(255, 70, 70, 0.25)',
        label: 'Urgent',
    },
};

const statusConfig = {
    TODO: { icon: ListTodo, label: 'To Do', color: 'rgba(0, 212, 255, 0.8)' },
    IN_PROGRESS: { icon: Clock, label: 'In Progress', color: 'rgba(255, 170, 0, 0.8)' },
    DONE: { icon: CheckCircle2, label: 'Done', color: 'rgba(100, 200, 100, 0.8)' },
};

/**
 * TaskCard - Glassmorphism-styled card displayed inline in chat
 * when the AI creates a task for the user.
 */
const TaskCard = ({ task }) => {
    const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
    const status = statusConfig[task.status] || statusConfig.TODO;
    const StatusIcon = status.icon;
    const score = task.priorityScore ?? 50;

    const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.15 }}
            className="mt-3 rounded-xl overflow-hidden"
            style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${priority.border}`,
                boxShadow: `0 0 20px ${priority.bg}, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
        >
            {/* Header bar */}
            <div
                className="flex items-center gap-2 px-4 py-2"
                style={{
                    background: priority.bg,
                    borderBottom: `1px solid ${priority.border}`,
                }}
            >
                <ListTodo className="w-4 h-4" style={{ color: priority.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: priority.color }}>
                    Task Created
                </span>
                {/* Priority score pill */}
                <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.3)', color: priority.color }}
                >
                    {score}/100
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">
                {/* Title */}
                <h4 className="text-white font-semibold text-sm leading-snug">
                    {task.title}
                </h4>

                {/* Description */}
                {task.description && (
                    <p className="text-gray-400 text-xs leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Owner & Due Date row */}
                <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    {task.owner && (
                        <span className="inline-flex items-center gap-1">
                            <User2 className="w-3 h-3" />
                            {task.owner}
                        </span>
                    )}
                    {formattedDueDate && (
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formattedDueDate}
                        </span>
                    )}
                </div>

                {/* Priority score bar */}
                <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: priority.color }}
                    />
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status badge */}
                    <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: status.color,
                        }}
                    >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                    </span>

                    {/* Priority badge */}
                    <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide"
                        style={{
                            background: priority.bg,
                            border: `1px solid ${priority.border}`,
                            color: priority.color,
                        }}
                    >
                        {task.priority === 'URGENT' ? (
                            <AlertTriangle className="w-3 h-3" />
                        ) : (
                            <ArrowUpCircle className="w-3 h-3" />
                        )}
                        {priority.label}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

TaskCard.propTypes = {
    task: PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        status: PropTypes.string.isRequired,
        priority: PropTypes.string.isRequired,
        priorityScore: PropTypes.number,
        owner: PropTypes.string,
        dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }).isRequired,
};

export default TaskCard;
