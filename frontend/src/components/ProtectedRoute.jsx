import { Navigate } from "react-router-dom";
import { useAuth, getRoleRedirectPath } from "../context/AuthContext";

/**
 * ProtectedRoute — Role-based route guard
 * @param {string[]} allowedRoles — Roles allowed to access this route
 * @param {ReactNode} children — Content to render if authorized
 */
export default function ProtectedRoute({ allowedRoles, children }) {
    const { user, isAuthenticated, loading } = useAuth();

    // Show loading spinner while auth state is being determined
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
            </div>
        );
    }

    // Not logged in → redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but wrong role → redirect to own dashboard (not 403)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={getRoleRedirectPath(user.role)} replace />;
    }

    return children;
}
