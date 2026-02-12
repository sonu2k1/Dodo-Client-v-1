import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Send, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ChatInput - Input field with send button for chat interface
 */
const ChatInput = ({ onSend, disabled = false, placeholder = 'Type your message...' }) => {
    const [message, setMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setMessage((prev) => prev + (prev ? ' ' : '') + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
            if (isListening) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div
                className="
                    flex items-center gap-3
                    backdrop-blur-[20px]
                    bg-[rgba(255,255,255,0.05)]
                    border border-[rgba(255,255,255,0.18)]
                    rounded-xl
                    px-4 py-3
                    transition-all duration-300
                    focus-within:bg-[rgba(255,255,255,0.08)]
                    focus-within:border-[rgba(255,255,255,0.25)]
                    focus-within:shadow-[0_0_20px_rgba(0,212,255,0.2)]
                "
            >
                {/* Voice Input Button */}
                {recognitionRef.current && (
                    <motion.button
                        type="button"
                        onClick={toggleListening}
                        className={`
                            flex-shrink-0
                            w-9 h-9
                            rounded-lg
                            backdrop-blur-[20px]
                            border border-[rgba(255,255,255,0.18)]
                            flex items-center justify-center
                            transition-all duration-300
                            ${isListening
                                ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                                : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                            }
                        `}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <AnimatePresence mode='wait'>
                            {isListening ? (
                                <motion.div
                                    key="stop"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    <Square className="w-4 h-4 text-red-500 fill-current" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="mic"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    <Mic className="w-4 h-4 text-gray-400" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled}
                    placeholder={isListening ? "Listening..." : placeholder}
                    className="
                        flex-1
                        bg-transparent
                        text-white
                        placeholder-gray-500
                        outline-none
                        text-sm
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                    "
                    autoFocus
                />

                <motion.button
                    type="submit"
                    disabled={disabled || !message.trim()}
                    className={`
                        flex-shrink-0
                        w-9 h-9
                        rounded-lg
                        backdrop-blur-[20px]
                        border border-[rgba(255,255,255,0.18)]
                        flex items-center justify-center
                        transition-all duration-300
                        ${disabled || !message.trim()
                            ? 'bg-[rgba(255,255,255,0.05)] opacity-50 cursor-not-allowed'
                            : 'bg-[rgba(0,212,255,0.15)] shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.2)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] cursor-pointer'
                        }
                    `}
                    whileTap={disabled || !message.trim() ? {} : { scale: 0.9 }}
                    whileHover={disabled || !message.trim() ? {} : { scale: 1.05 }}
                >
                    <Send className={`w-4 h-4 ${message.trim() ? 'text-neon-cyan' : 'text-gray-500'}`} />
                </motion.button>
            </div>
        </form>
    );
};

ChatInput.propTypes = {
    onSend: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
};

export default ChatInput;
