import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

/**
 * TypingIndicator - Animated typing indicator for AI responses
 */
const TypingIndicator = () => {
    const dotVariants = {
        start: { y: 0 },
        end: { y: -8 },
    };

    const dotTransition = {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
    };

    return (
        <div className="flex gap-3 mb-4">
            {/* Avatar */}
            <div
                className="
                    flex-shrink-0 w-10 h-10 rounded-full
                    backdrop-blur-[20px]
                    bg-[rgba(180,0,255,0.15)]
                    border border-[rgba(255,255,255,0.18)]
                    shadow-[0_0_20px_rgba(180,0,255,0.3)]
                    flex items-center justify-center
                "
            >
                <Bot className="w-5 h-5 text-neon-purple" />
            </div>

            {/* Typing Bubble */}
            <div
                className="
                    px-4 py-3 rounded-2xl rounded-tl-sm
                    backdrop-blur-[20px]
                    bg-[rgba(180,0,255,0.1)]
                    border border-[rgba(255,255,255,0.18)]
                    shadow-[0_0_15px_rgba(180,0,255,0.2)]
                    flex items-center gap-1.5
                "
            >
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="w-2 h-2 rounded-full bg-neon-purple"
                        variants={dotVariants}
                        initial="start"
                        animate="end"
                        transition={{
                            ...dotTransition,
                            delay: index * 0.15,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default TypingIndicator;
