import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassCard - Reusable glassmorphism card component with premium animations
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Card variant (default, medium, heavy, neon)
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.interactive - Enable click interactions
 * @param {boolean} props.float - Enable floating animation
 * @param {string} props.glowColor - Glow color (blue, purple, pink, cyan, green)
 * @param {Function} props.onClick - Click handler
 */
const GlassCard = ({
    children,
    className = '',
    variant = 'default',
    hover = true,
    interactive = false,
    float = false,
    glowColor = 'blue',
    onClick,
    ...props
}) => {
    // Variant styles
    const variants = {
        default: 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.12)]',
        medium: 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)]',
        heavy: 'bg-[rgba(255,255,255,0.12)] border-[rgba(255,255,255,0.2)]',
        neon: 'bg-[rgba(255,255,255,0.05)] border-[rgba(0,212,255,0.3)]',
    };

    // Glow colors for hover effect
    const glowColors = {
        blue: { boxShadow: '0 0 30px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.2)' },
        purple: { boxShadow: '0 0 30px rgba(180, 0, 255, 0.4), 0 0 60px rgba(180, 0, 255, 0.2)' },
        pink: { boxShadow: '0 0 30px rgba(255, 0, 229, 0.4), 0 0 60px rgba(255, 0, 229, 0.2)' },
        cyan: { boxShadow: '0 0 30px rgba(0, 255, 249, 0.4), 0 0 60px rgba(0, 255, 249, 0.2)' },
        green: { boxShadow: '0 0 30px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2)' },
    };

    // Base classes
    const baseClasses = `
        relative
        backdrop-blur-[20px]
        ${variants[variant] || variants.default}
        border
        rounded-2xl
        shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
        transition-all duration-300 ease-out
        ${interactive || onClick ? 'cursor-pointer' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    // Hover effects configuration
    const hoverEffects = hover ? {
        y: -5,
        scale: 1.02,
        ...glowColors[glowColor],
        borderColor: 'rgba(255, 255, 255, 0.25)',
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth feel
        }
    } : {};

    // Tap effects for interactive cards
    const tapEffects = interactive || onClick ? {
        scale: 0.98,
        transition: { duration: 0.1 }
    } : {};

    // Float animation
    const floatAnimation = float ? {
        y: [0, -8, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    } : {};

    return (
        <motion.div
            className={baseClasses}
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: 0,
                ...floatAnimation
            }}
            whileHover={hoverEffects}
            whileTap={tapEffects}
            onClick={onClick}
            style={{ willChange: hover || float ? 'transform, box-shadow' : 'auto' }}
            {...props}
        >
            {/* Subtle inner glow overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

GlassCard.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'medium', 'heavy', 'neon']),
    hover: PropTypes.bool,
    interactive: PropTypes.bool,
    float: PropTypes.bool,
    glowColor: PropTypes.oneOf(['blue', 'purple', 'pink', 'cyan', 'green']),
    onClick: PropTypes.func
};

export default GlassCard;
