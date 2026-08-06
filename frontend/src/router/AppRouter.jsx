import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import EquipmentDetail from "../pages/EquipmentDetail";
import Rental from "../pages/Rental";
import MyPage from "../pages/MyPage";
import AdminDashboard from "../pages/AdminDashboard";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/equipment/:id" element={<EquipmentDetail />} />
      <Route path="/rental" element={<Rental />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default AppRouter;
