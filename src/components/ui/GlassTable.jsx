import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlassTable - Glassmorphism styled table component
 *
 * Optional expandable rows:
 *   expandedRowIndex – index of the currently expanded row (null = none)
 *   renderExpandedRow(row) – renders the expanded content
 */
const GlassTable = ({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data available',
    expandedRowIndex = null,
    renderExpandedRow = null
}) => {
    if (loading) {
        return (
            <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] rounded-2xl p-8">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
                    <span className="ml-3 text-gray-400">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] rounded-2xl overflow-hidden"
        >
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.12)]">
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <React.Fragment key={rowIndex}>
                                    <motion.tr
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: rowIndex * 0.05 }}
                                        className={`border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-200 ${expandedRowIndex === rowIndex ? 'bg-[rgba(255,255,255,0.04)]' : ''
                                            }`}
                                    >
                                        {columns.map((col, colIndex) => (
                                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                                                {col.render ? col.render(row[col.accessor], row, rowIndex) : (
                                                    <span className="text-white">{row[col.accessor]}</span>
                                                )}
                                            </td>
                                        ))}
                                    </motion.tr>

                                    {/* Expandable detail row */}
                                    <AnimatePresence>
                                        {expandedRowIndex === rowIndex && renderExpandedRow && (
                                            <motion.tr
                                                key={`expanded-${rowIndex}`}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <td colSpan={columns.length} className="px-0 py-0">
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.25, delay: 0.05 }}
                                                    >
                                                        {renderExpandedRow(row)}
                                                    </motion.div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

GlassTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        header: PropTypes.string.isRequired,
        accessor: PropTypes.string.isRequired,
        render: PropTypes.func
    })).isRequired,
    data: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    emptyMessage: PropTypes.string,
    expandedRowIndex: PropTypes.number,
    renderExpandedRow: PropTypes.func
};

export default GlassTable;
