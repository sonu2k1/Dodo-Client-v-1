import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlassCard - Reusable glassmorphism card component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover glow animation
 * @param {string} props.glowColor - Glow color (blue, purple, pink, cyan, green)
 * @param {boolean} props.animated - Enable entrance animation
 * @param {Function} props.onClick - Click handler
 */
const GlassCard = ({
    children,
    className = '',
    hover = true,
    glowColor = 'blue',
    animated = false,
    onClick,
    ...props
}) => {
    const glowColors = {
        blue: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]',
        purple: 'hover:shadow-[0_0_30px_rgba(180,0,255,0.4)]',
        pink: 'hover:shadow-[0_0_30px_rgba(255,0,229,0.4)]',
        cyan: 'hover:shadow-[0_0_30px_rgba(0,255,249,0.4)]',
        green: 'hover:shadow-[0_0_30px_rgba(0,255,136,0.4)]',
    };

    const baseClasses = `
    relative
    backdrop-blur-[20px]
    bg-[rgba(255,255,255,0.05)]
    border border-[rgba(255,255,255,0.12)]
    rounded-2xl
    shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
    transition-all duration-300 ease-in-out
    ${hover ? 'hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]' : ''}
    ${hover && glowColors[glowColor] ? glowColors[glowColor] : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    const CardComponent = animated ? motion.div : 'div';

    const animationProps = animated ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' }
    } : {};

    return (
        <CardComponent
            className={baseClasses}
            onClick={onClick}
            {...animationProps}
            {...props}
        >
            {children}
        </CardComponent>
    );
};

GlassCard.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    hover: PropTypes.bool,
    glowColor: PropTypes.oneOf(['blue', 'purple', 'pink', 'cyan', 'green']),
    animated: PropTypes.bool,
    onClick: PropTypes.func,
};

export default GlassCard;
