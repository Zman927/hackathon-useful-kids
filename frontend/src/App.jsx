import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import EquipmentDetail from "./pages/EquipmentDetail";
import Rental from "./pages/Rental";
import MyPage from "./pages/MyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route 
          path="/equipment/:id" 
          element={<EquipmentDetail />} 
        />

        <Route 
          path="/rental" 
          element={<Rental />} 
        />

        <Route 
          path="/mypage" 
          element={<MyPage />} 
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;