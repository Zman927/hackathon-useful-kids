import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EquipmentDetail from "./pages/EquipmentDetail";
import Rental from "./pages/Rental";
import MyPage from "./pages/MyPage";

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route element={<Layout />}>
              <Route path="/equipment/:id" element={<EquipmentDetail />} />
              <Route path="/rental/:id" element={<Rental />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
