import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassButton - Premium glassmorphism button with smooth animations
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, outline, ghost)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {string} props.glowColor - Glow color (blue, purple, pink, cyan, green)
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.fullWidth - Full width button
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
const GlassButton = ({
    children,
    variant = 'primary',
    size = 'md',
    glowColor = 'blue',
    disabled = false,
    fullWidth = false,
    loading = false,
    onClick,
    className = '',
    type = 'button',
    ...props
}) => {
    // Glow shadow configurations
    const glowShadows = {
        blue: {
            default: '0 0 20px rgba(0, 212, 255, 0.25)',
            hover: '0 0 35px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.25)'
        },
        purple: {
            default: '0 0 20px rgba(180, 0, 255, 0.25)',
            hover: '0 0 35px rgba(180, 0, 255, 0.5), 0 0 60px rgba(180, 0, 255, 0.25)'
        },
        pink: {
            default: '0 0 20px rgba(255, 0, 229, 0.25)',
            hover: '0 0 35px rgba(255, 0, 229, 0.5), 0 0 60px rgba(255, 0, 229, 0.25)'
        },
        cyan: {
            default: '0 0 20px rgba(0, 255, 249, 0.25)',
            hover: '0 0 35px rgba(0, 255, 249, 0.5), 0 0 60px rgba(0, 255, 249, 0.25)'
        },
        green: {
            default: '0 0 20px rgba(0, 255, 136, 0.25)',
            hover: '0 0 35px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.25)'
        },
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const variants = {
        primary: `
            backdrop-blur-[20px]
            bg-[rgba(255,255,255,0.1)]
            border border-[rgba(255,255,255,0.18)]
            hover:bg-[rgba(255,255,255,0.15)]
        `,
        secondary: `
            backdrop-blur-[20px]
            bg-[rgba(255,255,255,0.05)]
            border border-[rgba(255,255,255,0.12)]
            hover:bg-[rgba(255,255,255,0.08)]
            hover:border-[rgba(255,255,255,0.18)]
        `,
        outline: `
            backdrop-blur-[20px]
            bg-transparent
            border-2 border-[rgba(255,255,255,0.2)]
            hover:bg-[rgba(255,255,255,0.05)]
            hover:border-[rgba(255,255,255,0.35)]
        `,
        ghost: `
            bg-transparent
            border border-transparent
            hover:bg-[rgba(255,255,255,0.05)]
            hover:border-[rgba(255,255,255,0.1)]
        `
    };

    const baseClasses = `
        relative
        rounded-xl
        font-medium
        text-white
        transition-all duration-300 ease-out
        ${sizes[size]}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const currentGlow = glowShadows[glowColor] || glowShadows.blue;
    const isInteractive = !disabled && !loading;

    return (
        <motion.button
            className={baseClasses}
            onClick={isInteractive ? onClick : undefined}
            disabled={disabled || loading}
            type={type}
            initial={{ boxShadow: variant === 'primary' ? currentGlow.default : 'none' }}
            whileHover={isInteractive ? {
                scale: 1.03,
                boxShadow: variant === 'primary' ? currentGlow.hover : 'none',
                transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }
            } : {}}
            whileTap={isInteractive ? {
                scale: 0.97,
                transition: { duration: 0.1 }
            } : {}}
            style={{ willChange: 'transform, box-shadow' }}
            {...props}
        >
            {/* Loading spinner */}
            {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </span>
            )}

            {/* Button content */}
            <span className={loading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </span>
        </motion.button>
    );
};

GlassButton.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    glowColor: PropTypes.oneOf(['blue', 'purple', 'pink', 'cyan', 'green']),
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    loading: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default GlassButton;
