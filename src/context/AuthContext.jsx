import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = '/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedUser) {
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Save auth state to localStorage
    const saveAuthState = useCallback((accessToken, refreshToken, user) => {
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    }, []);

    // Register new user
    const register = useCallback(async (email, password, name, phone) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            setUser(data.user);
            saveAuthState(data.accessToken, data.refreshToken, data.user);

            return { success: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [saveAuthState]);

    // Login user
    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            setUser(data.user);
            saveAuthState(data.accessToken, data.refreshToken, data.user);

            return { success: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [saveAuthState]);

    // Logout user
    const logout = useCallback(async () => {
        try {
            if (accessToken) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
            saveAuthState(null, null, null);
        }
    }, [accessToken, saveAuthState]);

    // Refresh access token
    const refreshAccessToken = useCallback(async () => {
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (!response.ok) {
                // Refresh token invalid, logout
                logout();
                return null;
            }

            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
            saveAuthState(data.accessToken, data.refreshToken, user);

            return data.accessToken;
        } catch (err) {
            console.error('Token refresh error:', err);
            logout();
            return null;
        }
    }, [refreshToken, user, saveAuthState, logout]);

    // Get current user profile
    const getProfile = useCallback(async () => {
        if (!accessToken) return null;

        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 401) {
                // Token expired, try refresh
                const newToken = await refreshAccessToken();
                if (newToken) {
                    return getProfile();
                }
                return null;
            }

            const data = await response.json();
            setUser(data.user);
            saveAuthState(accessToken, refreshToken, data.user);
            return data.user;
        } catch (err) {
            console.error('Get profile error:', err);
            return null;
        }
    }, [accessToken, refreshToken, refreshAccessToken, saveAuthState]);

    // Authenticated fetch wrapper
    const authFetch = useCallback(async (url, options = {}) => {
        if (!accessToken) {
            throw new Error('Not authenticated');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
        };

        let response = await fetch(url, { ...options, headers });

        // If unauthorized, try refreshing token
        if (response.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            }
        }

        return response;
    }, [accessToken, refreshAccessToken]);

    const value = {
        user,
        accessToken,
        loading,
        error,
        isAuthenticated: !!user && !!accessToken,
        register,
        login,
        logout,
        getProfile,
        authFetch,
        refreshAccessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
