import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

const MotionList = ({ children, className = "" }) => {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={className}
        >
            {/* 
                For this to work automatically, direct children of MotionList 
                should be motion components (motion.div, motion.li, etc.)
                OR wrapped in the MotionItem export below
            */}
            {children}
        </motion.div>
    );
};

export const MotionItem = ({ children, className = "", ...props }) => {
    return (
        <motion.div variants={item} className={className} {...props}>
            {children}
        </motion.div>
    );
};

MotionList.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

MotionItem.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default MotionList;
