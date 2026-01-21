import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Bot, User } from 'lucide-react';

/**
 * ChatMessage - Message bubble component for chat interface
 * Supports user and AI message types with different styling
 */
const ChatMessage = ({ message, type = 'ai', timestamp }) => {
    const isUser = type === 'user';

    const messageVariants = {
        hidden: {
            opacity: 0,
            x: isUser ? 50 : -50,
            scale: 0.8,
        },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 20,
            },
        },
    };

    return (
        <motion.div
            className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Avatar */}
            <div
                className={`
                    flex-shrink-0 w-10 h-10 rounded-full
                    backdrop-blur-[20px]
                    border border-[rgba(255,255,255,0.18)]
                    flex items-center justify-center
                    ${isUser
                        ? 'bg-[rgba(0,212,255,0.15)] shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                        : 'bg-[rgba(180,0,255,0.15)] shadow-[0_0_20px_rgba(180,0,255,0.3)]'
                    }
                `}
            >
                {isUser ? (
                    <User className="w-5 h-5 text-neon-cyan" />
                ) : (
                    <Bot className="w-5 h-5 text-neon-purple" />
                )}
            </div>

            {/* Message Bubble */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div
                    className={`
                        px-4 py-3 rounded-2xl
                        backdrop-blur-[20px]
                        border border-[rgba(255,255,255,0.18)]
                        ${isUser
                            ? 'bg-[rgba(0,212,255,0.1)] shadow-[0_0_15px_rgba(0,212,255,0.2)] rounded-tr-sm'
                            : 'bg-[rgba(180,0,255,0.1)] shadow-[0_0_15px_rgba(180,0,255,0.2)] rounded-tl-sm'
                        }
                    `}
                >
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                {/* Timestamp */}
                {timestamp && (
                    <span className="text-xs text-gray-500 mt-1 px-2">
                        {new Date(timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

ChatMessage.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['user', 'ai']).isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ChatMessage;
