import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassButton - Reusable glassmorphism button component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, outline)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {string} props.glowColor - Glow color (blue, purple, pink, cyan, green)
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.fullWidth - Full width button
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
    onClick,
    className = '',
    type = 'button',
    ...props
}) => {
    const glowColors = {
        blue: 'shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]',
        purple: 'shadow-[0_0_20px_rgba(180,0,255,0.3)] hover:shadow-[0_0_30px_rgba(180,0,255,0.5)]',
        pink: 'shadow-[0_0_20px_rgba(255,0,229,0.3)] hover:shadow-[0_0_30px_rgba(255,0,229,0.5)]',
        cyan: 'shadow-[0_0_20px_rgba(0,255,249,0.3)] hover:shadow-[0_0_30px_rgba(0,255,249,0.5)]',
        green: 'shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]',
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
      ${glowColors[glowColor]}
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
      hover:border-[rgba(255,255,255,0.3)]
    `,
    };

    const baseClasses = `
    relative
    rounded-xl
    font-medium
    text-white
    transition-all duration-300 ease-in-out
    ${sizes[size]}
    ${variants[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <motion.button
            className={baseClasses}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            type={type}
            whileTap={disabled ? {} : { scale: 0.95 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

GlassButton.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    glowColor: PropTypes.oneOf(['blue', 'purple', 'pink', 'cyan', 'green']),
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default GlassButton;
