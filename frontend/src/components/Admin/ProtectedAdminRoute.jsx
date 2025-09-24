import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAdminRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAdminToken = async () => {
            const adminUser = localStorage.getItem("adminUser");
            const parsedAdminUser = adminUser ? JSON.parse(adminUser) : null;
            if (!parsedAdminUser) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("http://localhost:4000/api/admin/verifyToken", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${parsedAdminUser?.userToken}`,
                        "Content-Type": "application/json",
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(data.role === "admin");
                    if (data.role !== "admin") localStorage.removeItem("adminToken");
                } else {
                    setIsAuthenticated(false);
                    localStorage.removeItem("adminToken");
                }
            } catch {
                setIsAuthenticated(false);
                localStorage.removeItem("adminToken");
            }
            setLoading(false);
        };

        verifyAdminToken();
    }, []);

    if (loading) return <div>Loading...</div>;

    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default ProtectedAdminRoute;
