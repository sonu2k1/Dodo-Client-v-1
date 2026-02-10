import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';

/**
 * Custom hook for invoice operations
 * Uses authenticated fetch for all API calls
 */
export const useInvoice = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentInvoice, setCurrentInvoice] = useState(null);

    /**
     * Generate a new invoice
     * @param {Object} invoiceData - Invoice data
     * @returns {Promise<Object>} Generated invoice
     */
    const generateInvoice = useCallback(async (invoiceData) => {
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authFetch(`${API_BASE}/invoices/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
    }, [authFetch, isAuthenticated]);

    /**
     * Get invoice by ID
     * @param {string} invoiceId - Invoice ID
     * @returns {Promise<Object>} Invoice details
     */
    const getInvoice = useCallback(async (invoiceId) => {
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authFetch(`${API_BASE}/invoices/${invoiceId}`);

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
    }, [authFetch, isAuthenticated]);

    /**
     * Get all invoices
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Invoice list
     */
    const getInvoices = useCallback(async (params = {}) => {
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }

        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await authFetch(`${API_BASE}/invoices?${queryParams}`);

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
    }, [authFetch, isAuthenticated]);

    /**
     * Regenerate AI explanation for invoice
     * @param {string} invoiceId - Invoice ID
     * @returns {Promise<Object>} Updated explanation
     */
    const regenerateExplanation = useCallback(async (invoiceId) => {
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authFetch(`${API_BASE}/invoices/${invoiceId}/explain`, {
                method: 'POST'
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
    }, [authFetch, isAuthenticated, currentInvoice]);

    /**
     * Generate invoice from transaction
     * @param {string} transactionId - Transaction ID
     * @returns {Promise<Object>} Generated invoice
     */
    const generateFromTransaction = useCallback(async (transactionId) => {
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authFetch(`${API_BASE}/invoices/from-transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
    }, [authFetch, isAuthenticated]);

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
