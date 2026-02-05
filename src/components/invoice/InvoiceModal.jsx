import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    FileText,
    Receipt,
    Sparkles,
    RefreshCw,
    Download,
    CheckCircle,
    Clock,
    AlertCircle,
    Tag,
    Percent,
    IndianRupee,
    Gift,
    MessageSquare,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

/**
 * InvoiceModal - Glassmorphism modal for displaying invoice with AI explanations
 */
const InvoiceModal = ({
    isOpen,
    onClose,
    invoice,
    onRegenerateExplanation,
    loading = false
}) => {
    const [expandedSection, setExpandedSection] = useState('explanation');
    const [regenerating, setRegenerating] = useState(false);

    if (!invoice) return null;

    const handleRegenerate = async () => {
        if (onRegenerateExplanation) {
            setRegenerating(true);
            try {
                await onRegenerateExplanation(invoice.invoiceId);
            } finally {
                setRegenerating(false);
            }
        }
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'text-green-400 bg-green-500/20';
            case 'pending': return 'text-yellow-400 bg-yellow-500/20';
            case 'cancelled': return 'text-red-400 bg-red-500/20';
            case 'refunded': return 'text-blue-400 bg-blue-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'cancelled': return <X className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        exit: { opacity: 0, scale: 0.95, y: 20 }
    };

    const sectionVariants = {
        hidden: { height: 0, opacity: 0 },
        visible: {
            height: 'auto',
            opacity: 1,
            transition: { duration: 0.3 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        variants={backdropVariants}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto 
                                   bg-gradient-to-br from-gray-900/95 to-gray-800/95 
                                   border border-white/10 rounded-2xl shadow-2xl"
                        variants={modalVariants}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 
                                      bg-gradient-to-r from-gray-900/95 to-gray-800/95 
                                      border-b border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 
                                              rounded-xl border border-indigo-500/30">
                                    <Receipt className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {invoice.title || 'Invoice'}
                                    </h2>
                                    <p className="text-sm text-gray-400 font-mono">
                                        {invoice.invoiceId}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                                text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                    {getStatusIcon(invoice.status)}
                                    {invoice.status?.toUpperCase()}
                                </span>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">

                            {/* AI Explanation Section */}
                            {invoice.aiExplanation && (
                                <motion.div
                                    className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 
                                             border border-indigo-500/20 rounded-xl overflow-hidden"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <button
                                        onClick={() => toggleSection('explanation')}
                                        className="w-full flex items-center justify-between p-4 
                                                 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-indigo-400" />
                                            <span className="font-semibold text-white">
                                                AI Invoice Explanation
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRegenerate();
                                                }}
                                                disabled={regenerating}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors
                                                         disabled:opacity-50"
                                                title="Regenerate explanation"
                                            >
                                                <RefreshCw className={`w-4 h-4 text-gray-400 
                                                    ${regenerating ? 'animate-spin' : ''}`} />
                                            </button>
                                            {expandedSection === 'explanation'
                                                ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                                : <ChevronDown className="w-5 h-5 text-gray-400" />
                                            }
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSection === 'explanation' && (
                                            <motion.div
                                                variants={sectionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="px-4 pb-4 space-y-4"
                                            >
                                                {/* Summary */}
                                                <div className="p-3 bg-white/5 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                                                        <span className="text-sm font-medium text-indigo-300">
                                                            Summary
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {invoice.aiExplanation.summary}
                                                    </p>
                                                </div>

                                                {/* Charge Breakdown */}
                                                <div className="p-3 bg-white/5 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Receipt className="w-4 h-4 text-blue-400" />
                                                        <span className="text-sm font-medium text-blue-300">
                                                            Charge Breakdown
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {invoice.aiExplanation.chargeBreakdown}
                                                    </p>
                                                </div>

                                                {/* Tax Explanation */}
                                                {invoice.totalTax > 0 && (
                                                    <div className="p-3 bg-white/5 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Percent className="w-4 h-4 text-yellow-400" />
                                                            <span className="text-sm font-medium text-yellow-300">
                                                                Tax Explanation
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            {invoice.aiExplanation.taxExplanation}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Discount Explanation */}
                                                {(invoice.totalDiscount > 0 || invoice.pointsValue > 0) && (
                                                    <div className="p-3 bg-white/5 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Gift className="w-4 h-4 text-green-400" />
                                                            <span className="text-sm font-medium text-green-300">
                                                                Discounts & Points
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            {invoice.aiExplanation.discountExplanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* Line Items */}
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                        <span className="font-semibold text-white">Line Items</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {invoice.items?.map((item, index) => (
                                        <div key={index} className="p-4 flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white">{item.name}</h4>
                                                {item.description && (
                                                    <p className="text-sm text-gray-400 mt-0.5">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.quantity} × ₹{item.unitPrice?.toFixed(2)}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-white">
                                                ₹{item.amount?.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                {/* Subtotal */}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="text-white">₹{invoice.subtotal?.toFixed(2)}</span>
                                </div>

                                {/* Taxes */}
                                {invoice.taxes?.map((tax, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5" />
                                            {tax.name} ({(tax.rate * 100).toFixed(1)}%)
                                        </span>
                                        <span className="text-white">+₹{tax.amount?.toFixed(2)}</span>
                                    </div>
                                ))}

                                {/* Discounts */}
                                {invoice.discounts?.map((discount, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-green-400 flex items-center gap-1.5">
                                            <Gift className="w-3.5 h-3.5" />
                                            {discount.name}
                                        </span>
                                        <span className="text-green-400">
                                            -₹{discount.amount?.toFixed(2)}
                                        </span>
                                    </div>
                                ))}

                                {/* Divider */}
                                <div className="border-t border-white/10 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-white">
                                            Grand Total
                                        </span>
                                        <span className="text-2xl font-bold text-transparent bg-clip-text 
                                                       bg-gradient-to-r from-indigo-400 to-purple-400">
                                            ₹{invoice.grandTotal?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Meta */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                <span>
                                    Created: {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                {invoice.paidAt && (
                                    <span>
                                        Paid: {new Date(invoice.paidAt).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 p-4 bg-gradient-to-r from-gray-900/95 to-gray-800/95 
                                      border-t border-white/10 backdrop-blur-xl flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-white/5 text-white font-medium rounded-xl
                                         hover:bg-white/10 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 
                                         text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25
                                         hover:shadow-xl hover:shadow-indigo-500/30 transition-all
                                         flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InvoiceModal;
