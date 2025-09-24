import { Routes, Route } from "react-router-dom";

import Home from "../components/Admin/Home";
import Login from "../components/Admin/Login";
import ProtectedAdminRoute from "../components/Admin/ProtectedAdminRoute";

const Admin = () => {
    return (
        <Routes>
            <Route element={<ProtectedAdminRoute />}>
                <Route path="/home/*" element={<Home />} />
            </Route>
            <Route path="/login" element={<Login />} />
        </Routes>

    );
};

export default Admin;
