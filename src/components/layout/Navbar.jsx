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
    ChevronDown,
    AlertTriangle,
    ShieldAlert,
    TrendingDown,
    Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SEVERITY_CONFIG = {
    critical: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        label: 'Critical',
        icon: ShieldAlert,
        dot: 'bg-red-500'
    },
    warning: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        label: 'Warning',
        icon: AlertTriangle,
        dot: 'bg-amber-500'
    }
};

/**
 * Navbar - Glass top navigation bar component
 */
const Navbar = ({
    isSidebarCollapsed,
    isMobileMenuOpen,
    onToggleMobileMenu,
    anomalies = [],
    riskLevel = 'low',
    onDismissAnomaly,
    onNavigate
}) => {
    const { user, logout, isAuthenticated } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);

    const handleLogout = async () => {
        await logout();
        setShowProfileMenu(false);
    };

    const activeCount = anomalies.length;
    const hasCritical = riskLevel === 'high';

    return (
        <motion.nav
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`
                fixed top-0 right-0 z-30
                backdrop-blur-[24px] bg-[rgba(255,255,255,0.05)]
                border-b border-[rgba(255,255,255,0.12)]
                transition-all duration-300
                left-0 ${isSidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[280px]'}
            `}
        >
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
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
                    <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
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
                    {/* Notifications / Anomaly Bell */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowAlerts(!showAlerts); setShowProfileMenu(false); }}
                            className={`
                  relative p-2.5 rounded-xl
                  backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)]
                  border border-[rgba(255,255,255,0.12)]
                  hover:bg-[rgba(255,255,255,0.08)]
                  hover:border-[rgba(255,255,255,0.18)]
                  transition-all duration-300
                  text-gray-400 hover:text-white
                  ${hasCritical ? 'shadow-[0_0_20px_rgba(255,50,50,0.25)] border-red-500/30' : activeCount > 0 ? 'shadow-[0_0_15px_rgba(255,180,0,0.15)]' : 'hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]'}
                `}
                        >
                            <Bell size={20} />
                            {/* Badge */}
                            {activeCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`
                      absolute -top-1 -right-1 w-5 h-5
                      ${hasCritical ? 'bg-red-500' : 'bg-amber-500'} rounded-full
                      flex items-center justify-center
                      text-[10px] font-bold text-white
                      ${hasCritical ? 'shadow-[0_0_10px_rgba(255,50,50,0.6)]' : 'shadow-[0_0_10px_rgba(255,180,0,0.5)]'}
                    `}
                                >
                                    {activeCount}
                                </motion.span>
                            )}
                            {activeCount === 0 && (
                                <span className="
                  absolute -top-1 -right-1 w-5 h-5
                  bg-neon-pink rounded-full
                  flex items-center justify-center
                  text-[10px] font-bold text-white
                  shadow-[0_0_10px_rgba(255,0,229,0.5)]
                ">0</span>
                            )}
                        </button>

                        {/* Anomaly Dropdown */}
                        <AnimatePresence>
                            {showAlerts && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl
                                        backdrop-blur-[24px] bg-[rgba(15,15,25,0.95)]
                                        border border-[rgba(255,255,255,0.12)]
                                        shadow-2xl max-h-[70vh] flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-amber-400" />
                                            <span className="text-sm font-semibold text-white">Risk Alerts</span>
                                            {activeCount > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                                                    ${hasCritical
                                                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                                    }`}
                                                >
                                                    {activeCount} active
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowAlerts(false)}
                                            className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Alerts List */}
                                    <div className="overflow-y-auto flex-1 scrollbar-glass">
                                        {activeCount === 0 ? (
                                            <div className="px-4 py-10 text-center">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring' }}
                                                >
                                                    <ShieldAlert size={32} className="mx-auto text-emerald-400/50 mb-3" />
                                                </motion.div>
                                                <p className="text-sm text-gray-400">No active risk alerts</p>
                                                <p className="text-[10px] text-gray-600 mt-1">Your finances look healthy</p>
                                            </div>
                                        ) : (
                                            anomalies.map((alert, i) => {
                                                const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning;
                                                const SevIcon = cfg.icon;
                                                return (
                                                    <motion.div
                                                        key={alert.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className={`px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                                                                <SevIcon size={14} className={cfg.text} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-medium text-white truncate">{alert.label}</span>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                                                                        {cfg.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-400 leading-relaxed mb-1.5">
                                                                    {alert.aiExplanation || alert.detail}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    {alert.navTarget && onNavigate && (
                                                                        <button
                                                                            onClick={() => { onNavigate(alert.navTarget); setShowAlerts(false); }}
                                                                            className="text-[10px] text-neon-cyan hover:underline"
                                                                        >
                                                                            View details →
                                                                        </button>
                                                                    )}
                                                                    {onDismissAnomaly && (
                                                                        <button
                                                                            onClick={() => onDismissAnomaly(alert.id)}
                                                                            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                                                                        >
                                                                            Dismiss
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowAlerts(false); }}
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
    anomalies: PropTypes.array,
    riskLevel: PropTypes.string,
    onDismissAnomaly: PropTypes.func,
    onNavigate: PropTypes.func,
};

export default Navbar;
