import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * AppLayout - Main application layout wrapper
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main content
 * @param {string} props.activeNav - Active navigation item
 * @param {Function} props.onNavigate - Navigation handler
 */
const AppLayout = ({ children, activeNav = 'ai-concierge', onNavigate }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleToggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleNavigate = (navItem) => {
        onNavigate(navItem);
        // Close mobile menu on navigation
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-dark relative overflow-hidden">
            {/* Animated Background Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-blue/20 blur-[120px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-purple/20 blur-[120px]"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.4, 0.2, 0.4],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-neon-cyan/20 blur-[120px]"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 14,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar
                    activeItem={activeNav}
                    onNavigate={handleNavigate}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={handleToggleSidebar}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleToggleMobileMenu}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Mobile Sidebar */}
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="lg:hidden fixed left-0 top-0 z-50"
                        >
                            <Sidebar
                                activeItem={activeNav}
                                onNavigate={handleNavigate}
                                isCollapsed={false}
                                onToggleCollapse={handleToggleMobileMenu}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Navbar */}
            <div className="hidden lg:block">
                <Navbar
                    isSidebarCollapsed={isSidebarCollapsed}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onToggleMobileMenu={handleToggleMobileMenu}
                />
            </div>

            {/* Mobile Navbar */}
            <div className="lg:hidden">
                <motion.nav
                    initial={{ y: -80 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="
            fixed top-0 left-0 right-0 z-30
            backdrop-blur-[24px] bg-[rgba(255,255,255,0.05)]
            border-b border-[rgba(255,255,255,0.12)]
          "
                >
                    <Navbar
                        isSidebarCollapsed={false}
                        isMobileMenuOpen={isMobileMenuOpen}
                        onToggleMobileMenu={handleToggleMobileMenu}
                    />
                </motion.nav>
            </div>

            {/* Main Content Area */}
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="
          relative z-10
          transition-all duration-300
          pt-20 lg:pt-24
        "
                style={{
                    marginLeft: isSidebarCollapsed ? '80px' : '280px',
                    '@media (max-width: 1024px)': {
                        marginLeft: 0,
                    }
                }}
            >
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </motion.main>
        </div>
    );
};

AppLayout.propTypes = {
    children: PropTypes.node.isRequired,
    activeNav: PropTypes.string,
    onNavigate: PropTypes.func.isRequired,
};

export default AppLayout;
