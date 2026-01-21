import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
    Bot,
    Wallet,
    Shield,
    Receipt,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

/**
 * Sidebar - Glass sidebar navigation component
 * 
 * @param {Object} props
 * @param {string} props.activeItem - Currently active navigation item
 * @param {Function} props.onNavigate - Navigation handler
 * @param {boolean} props.isCollapsed - Sidebar collapsed state
 * @param {Function} props.onToggleCollapse - Toggle collapse handler
 */
const Sidebar = ({
    activeItem,
    onNavigate,
    isCollapsed = false,
    onToggleCollapse
}) => {
    const navigationItems = [
        { id: 'ai-concierge', label: 'AI Concierge', icon: Bot, color: 'cyan' },
        { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'blue' },
        { id: 'trust-logs', label: 'Trust Logs', icon: Shield, color: 'purple' },
        { id: 'transactions', label: 'Transactions', icon: Receipt, color: 'pink' },
        { id: 'settings', label: 'Settings', icon: Settings, color: 'green' },
    ];

    const glowColors = {
        cyan: 'hover:shadow-[0_0_20px_rgba(0,255,249,0.3)]',
        blue: 'hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]',
        purple: 'hover:shadow-[0_0_20px_rgba(180,0,255,0.3)]',
        pink: 'hover:shadow-[0_0_20px_rgba(255,0,229,0.3)]',
        green: 'hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]',
    };

    const activeColors = {
        cyan: 'bg-[rgba(0,255,249,0.1)] border-[rgba(0,255,249,0.3)] shadow-[0_0_20px_rgba(0,255,249,0.2)]',
        blue: 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.3)] shadow-[0_0_20px_rgba(0,212,255,0.2)]',
        purple: 'bg-[rgba(180,0,255,0.1)] border-[rgba(180,0,255,0.3)] shadow-[0_0_20px_rgba(180,0,255,0.2)]',
        pink: 'bg-[rgba(255,0,229,0.1)] border-[rgba(255,0,229,0.3)] shadow-[0_0_20px_rgba(255,0,229,0.2)]',
        green: 'bg-[rgba(0,255,136,0.1)] border-[rgba(0,255,136,0.3)] shadow-[0_0_20px_rgba(0,255,136,0.2)]',
    };

    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{
                x: 0,
                width: isCollapsed ? 80 : 280
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-screen backdrop-blur-[24px] bg-[rgba(255,255,255,0.05)] border-r border-[rgba(255,255,255,0.12)] z-40"
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="p-6 border-b border-[rgba(255,255,255,0.12)]">
                    <motion.div
                        animate={{ opacity: isCollapsed ? 0 : 1 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
                            <Bot className="text-white" size={24} />
                        </div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <h1 className="text-xl font-bold text-gradient-neon">
                                        Dodo Point
                                    </h1>
                                    <p className="text-xs text-gray-400">Client Concierge</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-glass">
                    {navigationItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;

                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onNavigate(item.id)}
                                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  backdrop-blur-[20px] border
                  transition-all duration-300
                  ${isActive
                                        ? activeColors[item.color]
                                        : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                                    }
                  ${!isActive && glowColors[item.color]}
                `.trim().replace(/\s+/g, ' ')}
                            >
                                <Icon
                                    size={20}
                                    className={isActive ? `text-neon-${item.color}` : 'text-gray-400'}
                                />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Collapse Toggle */}
                <div className="p-4 border-t border-[rgba(255,255,255,0.12)]">
                    <button
                        onClick={onToggleCollapse}
                        className="
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)]
              border border-[rgba(255,255,255,0.12)]
              hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]
              transition-all duration-300
              text-gray-400 hover:text-white
            "
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="text-sm font-medium"
                                >
                                    Collapse
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};

Sidebar.propTypes = {
    activeItem: PropTypes.string.isRequired,
    onNavigate: PropTypes.func.isRequired,
    isCollapsed: PropTypes.bool,
    onToggleCollapse: PropTypes.func.isRequired,
};

export default Sidebar;
