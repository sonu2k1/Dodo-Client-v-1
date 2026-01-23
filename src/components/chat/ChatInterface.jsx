import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

/**
 * ChatInterface - Main chat container with message history and input
 */
const ChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            message: 'Hello! I\'m your AI Concierge powered by Google Gemini. How can I assist you today?',
            timestamp: Date.now(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    // Persist session ID in localStorage to survive reloads
    const sessionIdRef = useRef('');

    useEffect(() => {
        let storedSessionId = localStorage.getItem('dodo_session_id');
        if (!storedSessionId) {
            storedSessionId = 'user-session-' + Date.now();
            localStorage.setItem('dodo_session_id', storedSessionId);
        }
        sessionIdRef.current = storedSessionId;
    }, []);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Call backend API for AI response
    const callAIAPI = async (userMessage) => {
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:3001/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: sessionIdRef.current, // Use persisted session ID
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    type: 'ai',
                    message: data.message,
                    timestamp: data.timestamp,
                },
            ]);
        } catch (error) {
            console.error('AI API Error:', error);
            // Fallback error message
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    type: 'ai',
                    message: 'Sorry, I encountered an error. Please make sure the backend server is running and try again.',
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = (message) => {
        // Add user message
        const userMessage = {
            id: Date.now(),
            type: 'user',
            message,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Call backend API
        callAIAPI(message);
    };

    return (
        <div className="flex flex-col h-[600px]">
            {/* Chat Messages Container */}
            <div
                className="
                    flex-1 overflow-y-auto px-6 py-4
                    scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.2)]
                    scrollbar-track-transparent
                    hover:scrollbar-thumb-[rgba(255,255,255,0.3)]
                "
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                }}
            >
                {messages.map((msg) => (
                    <ChatMessage
                        key={msg.id}
                        message={msg.message}
                        type={msg.type}
                        timestamp={msg.timestamp}
                    />
                ))}

                {isTyping && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)]">
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
            </div>
        </div>
    );
};

export default ChatInterface;
