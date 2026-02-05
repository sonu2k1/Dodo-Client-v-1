import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

/**
 * Custom hook for Razorpay payment operations
 * Handles payment order creation, verification, and Razorpay checkout
 */
export const usePayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastPayment, setLastPayment] = useState(null);

    /**
     * Generate a unique idempotency key
     */
    const generateIdempotencyKey = useCallback(() => {
        return `IDEM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }, []);

    /**
     * Load Razorpay script dynamically
     */
    const loadRazorpayScript = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
            document.body.appendChild(script);
        });
    }, []);

    /**
     * Create a payment order
     * @param {number} amount - Amount in rupees
     * @param {string} currency - Currency code (default: INR)
     * @returns {Promise<Object>} Order details
     */
    const createOrder = useCallback(async (amount, currency = 'INR') => {
        setLoading(true);
        setError(null);

        try {
            // Amount in paise (1 INR = 100 paise)
            const amountInPaise = Math.round(amount * 100);
            const idempotencyKey = generateIdempotencyKey();

            const response = await fetch(`${API_BASE}/payments/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency,
                    idempotencyKey
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create order');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [generateIdempotencyKey]);

    /**
     * Verify payment after Razorpay callback
     * @param {Object} paymentData - Payment data from Razorpay
     * @returns {Promise<Object>} Verification result
     */
    const verifyPayment = useCallback(async (paymentData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/payments/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Payment verification failed');
            }

            const data = await response.json();
            setLastPayment(data.payment);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Initiate payment flow
     * @param {number} amount - Amount in rupees
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Payment result
     */
    const initiatePayment = useCallback(async (amount, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            // Load Razorpay SDK
            await loadRazorpayScript();

            // Create order
            const orderData = await createOrder(amount, options.currency || 'INR');

            // Open Razorpay checkout
            return new Promise((resolve, reject) => {
                const razorpayOptions = {
                    key: orderData.keyId,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: options.name || 'DoDo Client',
                    description: options.description || 'Add Funds to Wallet',
                    order_id: orderData.orderId,
                    prefill: {
                        name: options.prefillName || '',
                        email: options.prefillEmail || '',
                        contact: options.prefillContact || ''
                    },
                    theme: {
                        color: options.themeColor || '#6366f1'
                    },
                    handler: async function (response) {
                        try {
                            // Verify payment
                            const verification = await verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            setLoading(false);
                            resolve(verification);
                        } catch (err) {
                            setLoading(false);
                            reject(err);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false);
                            reject(new Error('Payment cancelled by user'));
                        }
                    }
                };

                const razorpay = new window.Razorpay(razorpayOptions);
                razorpay.open();
            });
        } catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    }, [loadRazorpayScript, createOrder, verifyPayment]);

    /**
     * Get payment history
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Payment history
     */
    const getPaymentHistory = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE}/payments?${queryParams}`, {
                headers: {
                    'x-user-id': 'demo-user-001'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payment history');
            }

            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get payment configuration
     * @returns {Promise<Object>} Payment config
     */
    const getPaymentConfig = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/payments/config/razorpay`);
            return await response.json();
        } catch (err) {
            setError(err.message);
            return { configured: false };
        }
    }, []);

    return {
        loading,
        error,
        lastPayment,
        initiatePayment,
        createOrder,
        verifyPayment,
        getPaymentHistory,
        getPaymentConfig,
        generateIdempotencyKey
    };
};

export default usePayment;
