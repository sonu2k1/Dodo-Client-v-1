import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * GlassModal - Reusable glassmorphism modal component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.title - Modal title
 * @param {string} props.size - Modal size (sm, md, lg, xl, full)
 * @param {boolean} props.closeOnOverlayClick - Close modal on overlay click
 * @param {boolean} props.closeOnEscape - Close modal on Escape key
 * @param {boolean} props.showCloseButton - Show close button
 * @param {string} props.className - Additional CSS classes
 */
const GlassModal = ({
    isOpen,
    onClose,
    children,
    title = '',
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    className = '',
}) => {
    // Handle Escape key press
    useEffect(() => {
        if (!closeOnEscape || !isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [closeOnEscape, isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw]',
    };

    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`
              relative
              w-full
              ${sizes[size]}
              backdrop-blur-[24px]
              bg-[rgba(255,255,255,0.05)]
              border border-[rgba(255,255,255,0.12)]
              rounded-2xl
              shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
              max-h-[90vh]
              overflow-hidden
              ${className}
            `.trim().replace(/\s+/g, ' ')}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.12)]">
                                {title && (
                                    <h2 className="text-2xl font-bold text-white">
                                        {title}
                                    </h2>
                                )}

                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="
                      ml-auto
                      p-2
                      rounded-lg
                      text-gray-400
                      hover:text-white
                      hover:bg-[rgba(255,255,255,0.1)]
                      transition-all duration-200
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[rgba(0,212,255,0.4)]
                    "
                                        aria-label="Close modal"
                                    >
                                        <X size={24} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-glass">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

GlassModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
    closeOnOverlayClick: PropTypes.bool,
    closeOnEscape: PropTypes.bool,
    showCloseButton: PropTypes.bool,
    className: PropTypes.string,
};

export default GlassModal;
