import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

/**
 * Custom hook for invoice operations
 */
export const useInvoice = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentInvoice, setCurrentInvoice] = useState(null);

    /**
     * Generate a new invoice
     * @param {Object} invoiceData - Invoice data
     * @returns {Promise<Object>} Generated invoice
     */
    const generateInvoice = useCallback(async (invoiceData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/invoices/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify(invoiceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate invoice');
            }

            const data = await response.json();
            setCurrentInvoice(data.invoice);
            return data.invoice;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get invoice by ID
     * @param {string} invoiceId - Invoice ID
     * @returns {Promise<Object>} Invoice details
     */
    const getInvoice = useCallback(async (invoiceId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
                headers: {
                    'x-user-id': 'demo-user-001'
                }
            });

            if (!response.ok) {
                throw new Error('Invoice not found');
            }

            const invoice = await response.json();
            setCurrentInvoice(invoice);
            return invoice;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get all invoices
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Invoice list
     */
    const getInvoices = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE}/invoices?${queryParams}`, {
                headers: {
                    'x-user-id': 'demo-user-001'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
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
     * Regenerate AI explanation for invoice
     * @param {string} invoiceId - Invoice ID
     * @returns {Promise<Object>} Updated explanation
     */
    const regenerateExplanation = useCallback(async (invoiceId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/invoices/${invoiceId}/explain`, {
                method: 'POST',
                headers: {
                    'x-user-id': 'demo-user-001'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate explanation');
            }

            const data = await response.json();

            // Update current invoice if it matches
            if (currentInvoice && currentInvoice.invoiceId === invoiceId) {
                setCurrentInvoice(prev => ({
                    ...prev,
                    aiExplanation: data.aiExplanation
                }));
            }

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentInvoice]);

    /**
     * Generate invoice from transaction
     * @param {string} transactionId - Transaction ID
     * @returns {Promise<Object>} Generated invoice
     */
    const generateFromTransaction = useCallback(async (transactionId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/invoices/from-transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify({ transactionId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate invoice');
            }

            const data = await response.json();
            setCurrentInvoice(data.invoice);
            return data.invoice;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Clear current invoice
     */
    const clearInvoice = useCallback(() => {
        setCurrentInvoice(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        currentInvoice,
        generateInvoice,
        getInvoice,
        getInvoices,
        regenerateExplanation,
        generateFromTransaction,
        clearInvoice,
        setCurrentInvoice
    };
};

export default useInvoice;
