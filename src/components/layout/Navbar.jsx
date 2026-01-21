import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
    Bell,
    Search,
    User,
    Menu,
    X
} from 'lucide-react';

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

                    {/* Profile */}
                    <button
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
                            <p className="text-sm font-medium text-white">John Doe</p>
                            <p className="text-xs text-gray-400">Premium User</p>
                        </div>
                    </button>
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
