import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet, IndianRupee, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

/**
 * AddFundsModal - Modal component for adding funds via Razorpay
 */
const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [message, setMessage] = useState('');

    const { initiatePayment, loading, error } = usePayment();

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    const handlePresetAmount = (preset) => {
        setAmount(preset.toString());
    };

    const handlePayment = async () => {
        const numAmount = parseInt(amount);

        if (!numAmount || numAmount < 1) {
            setMessage('Please enter a valid amount');
            setStatus('error');
            return;
        }

        if (numAmount < 10) {
            setMessage('Minimum amount is ₹10');
            setStatus('error');
            return;
        }

        setStatus('processing');
        setMessage('');

        try {
            const result = await initiatePayment(numAmount, {
                name: 'DoDo Wallet',
                description: `Add ₹${numAmount} to wallet`,
                themeColor: '#6366f1'
            });

            setStatus('success');
            setMessage(`Successfully added ₹${numAmount} to your wallet!`);

            // Callback to parent
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(result);
                    handleClose();
                }, 2000);
            }
        } catch (err) {
            if (err.message === 'Payment cancelled by user') {
                setStatus('idle');
                setMessage('');
            } else {
                setStatus('error');
                setMessage(err.message || 'Payment failed. Please try again.');
            }
        }
    };

    const handleClose = () => {
        if (status !== 'processing') {
            setAmount('');
            setStatus('idle');
            setMessage('');
            onClose();
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        variants={backdropVariants}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 to-gray-800/95 
                                   border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        variants={modalVariants}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Wallet className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Add Funds</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={status === 'processing'}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Success State */}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </motion.div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
                                    <p className="text-gray-400">{message}</p>
                                </motion.div>
                            )}

                            {/* Error State */}
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                    <div>
                                        <p className="text-red-400 font-medium">Payment Error</p>
                                        <p className="text-red-400/70 text-sm">{message}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Payment Form */}
                            {status !== 'success' && (
                                <>
                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Enter Amount
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                <IndianRupee className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                placeholder="0"
                                                disabled={status === 'processing'}
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 
                                                         rounded-xl text-2xl font-semibold text-white placeholder-gray-600
                                                         focus:outline-none focus:border-indigo-500/50 focus:ring-2 
                                                         focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Preset Amounts */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Quick Select
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {PRESET_AMOUNTS.map((preset) => (
                                                <button
                                                    key={preset}
                                                    onClick={() => handlePresetAmount(preset)}
                                                    disabled={status === 'processing'}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all
                                                              ${amount === preset.toString()
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        } disabled:opacity-50`}
                                                >
                                                    ₹{preset.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Gateway Info */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <CreditCard className="w-4 h-4" />
                                        <span>Secured by Razorpay</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {status !== 'success' && (
                            <div className="p-6 pt-0">
                                <button
                                    onClick={handlePayment}
                                    disabled={!amount || parseInt(amount) < 10 || status === 'processing'}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 
                                             text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25
                                             hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02]
                                             active:scale-[0.98] transition-all disabled:opacity-50 
                                             disabled:cursor-not-allowed disabled:hover:scale-100
                                             flex items-center justify-center gap-2"
                                >
                                    {status === 'processing' ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5" />
                                            Pay ₹{amount || '0'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddFundsModal;
