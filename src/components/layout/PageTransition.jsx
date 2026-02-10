import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Page transition variants for different animation styles
const transitionVariants = {
    fade: {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.3, ease: 'easeInOut' }
        }
    },
    slide: {
        initial: { opacity: 0, x: 30 },
        animate: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: {
            opacity: 0,
            x: -30,
            transition: { duration: 0.3, ease: 'easeInOut' }
        }
    },
    slideUp: {
        initial: { opacity: 0, y: 30, scale: 0.98 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.98,
            transition: { duration: 0.3, ease: 'easeInOut' }
        }
    },
    scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.3, ease: 'easeInOut' }
        }
    },
    none: {
        initial: {},
        animate: {},
        exit: {}
    }
};

/**
 * PageTransition - Smooth page transition wrapper with multiple variants
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.variant - Transition variant (fade, slide, slideUp, scale, none)
 * @param {string} props.className - Additional CSS classes
 */
const PageTransition = ({
    children,
    variant = 'slideUp',
    className = ''
}) => {
    const selectedVariant = transitionVariants[variant] || transitionVariants.slideUp;

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={selectedVariant}
            className={`w-full h-full ${className}`}
            style={{ willChange: 'transform, opacity' }}
        >
            {children}
        </motion.div>
    );
};

PageTransition.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['fade', 'slide', 'slideUp', 'scale', 'none']),
    className: PropTypes.string
};

export default PageTransition;
