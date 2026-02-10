import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
    Bell,
    Search,
    User,
    Menu,
    X,
    LogOut,
    Settings,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar - Glass top navigation bar component
 * 
 * @param {Object} props
 * @param {boolean} props.isSidebarCollapsed - Sidebar collapsed state
 * @param {boolean} props.isMobileMenuOpen - Mobile menu open state
 * @param {Function} props.onToggleMobileMenu - Toggle mobile menu handler
 */
const Navbar = ({
    isSidebarCollapsed,
    isMobileMenuOpen,
    onToggleMobileMenu
}) => {
    const { user, logout, isAuthenticated } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = async () => {
        await logout();
        setShowProfileMenu(false);
    };

    return (
        <motion.nav
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="
        fixed top-0 right-0 z-30
        backdrop-blur-[24px] bg-[rgba(255,255,255,0.05)]
        border-b border-[rgba(255,255,255,0.12)]
        transition-all duration-300
      "
            style={{
                left: isSidebarCollapsed ? '80px' : '280px',
                width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
            }}
        >
            <div className="flex items-center justify-between px-6 py-4">
                {/* Left Section - Mobile Menu & Search */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onToggleMobileMenu}
                        className="
              lg:hidden p-2 rounded-lg
              backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)]
              border border-[rgba(255,255,255,0.12)]
              hover:bg-[rgba(255,255,255,0.08)]
              transition-all duration-300
              text-gray-400 hover:text-white
            "
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="
                  w-full pl-10 pr-4 py-2.5 rounded-xl
                  backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)]
                  border border-[rgba(255,255,255,0.12)]
                  text-white placeholder-gray-400
                  outline-none
                  transition-all duration-300
                  focus:bg-[rgba(255,255,255,0.08)]
                  focus:border-[rgba(0,212,255,0.3)]
                  focus:shadow-[0_0_20px_rgba(0,212,255,0.2)]
                "
                            />
                        </div>
                    </div>
                </div>

                {/* Right Section - Notifications & Profile */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <button
                        className="
              relative p-2.5 rounded-xl
              backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)]
              border border-[rgba(255,255,255,0.12)]
              hover:bg-[rgba(255,255,255,0.08)]
              hover:border-[rgba(255,255,255,0.18)]
              hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]
              transition-all duration-300
              text-gray-400 hover:text-white
            "
                    >
                        <Bell size={20} />
                        {/* Notification Badge */}
                        <span className="
              absolute -top-1 -right-1 w-5 h-5
              bg-neon-pink rounded-full
              flex items-center justify-center
              text-[10px] font-bold text-white
              shadow-[0_0_10px_rgba(255,0,229,0.5)]
            ">
                            3
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="
              flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl
              backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)]
              border border-[rgba(255,255,255,0.12)]
              hover:bg-[rgba(255,255,255,0.08)]
              hover:border-[rgba(255,255,255,0.18)]
              hover:shadow-[0_0_20px_rgba(0,255,249,0.2)]
              transition-all duration-300
            "
                        >
                            <div className="
              w-8 h-8 rounded-lg
              bg-gradient-to-br from-neon-cyan to-neon-purple
              flex items-center justify-center
            ">
                                <User size={18} className="text-white" />
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-white">
                                    {user?.name || 'Guest'}
                                </p>
                                <p className="text-xs text-gray-400 capitalize">
                                    {user?.role || 'User'}
                                </p>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-56 py-2 rounded-xl
                                        backdrop-blur-[24px] bg-[rgba(20,20,20,0.95)]
                                        border border-[rgba(255,255,255,0.12)]
                                        shadow-2xl"
                                >
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-white font-medium">{user?.name}</p>
                                        <p className="text-gray-400 text-sm">{user?.email}</p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                                                text-gray-300 hover:text-white hover:bg-white/5
                                                transition-colors"
                                        >
                                            <Settings size={18} />
                                            <span>Settings</span>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                                                text-red-400 hover:text-red-300 hover:bg-red-500/10
                                                transition-colors"
                                        >
                                            <LogOut size={18} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

Navbar.propTypes = {
    isSidebarCollapsed: PropTypes.bool.isRequired,
    isMobileMenuOpen: PropTypes.bool.isRequired,
    onToggleMobileMenu: PropTypes.func.isRequired,
};

export default Navbar;

