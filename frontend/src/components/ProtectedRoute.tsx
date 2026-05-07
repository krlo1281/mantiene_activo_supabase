import { Navigate, Outlet } from 'react-router-dom';

const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return false;
        
        // Fix base64url to base64
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        // exp is in seconds, Date.now() is in ms
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

export default function ProtectedRoute() {
    const token = localStorage.getItem('token');

    if (!isTokenValid(token)) {
        // Clear invalid or expired session data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
