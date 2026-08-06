import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getEquipmentList } from "../api/equipmentApi";
import EquipmentCard from "../components/equipment/EquipmentCard";
import EmptyState from "../components/common/EmptyState";

function Home() {
  const { selectedDepartmentId } = useApp();
  const [equipmentList, setEquipmentList] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedDepartmentId) {
      setEquipmentList([]);
      return;
    }

    setError("");
    getEquipmentList(selectedDepartmentId)
      .then(setEquipmentList)
      .catch(() => setError("기자재 목록을 불러오지 못했습니다."));
  }, [selectedDepartmentId]);

  if (!selectedDepartmentId) {
    return <EmptyState message="학과를 선택해주세요." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (equipmentList.length === 0) {
    return <EmptyState message="대여 가능한 기자재가 없습니다." />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      {equipmentList.map((equipment) => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          onClick={() => navigate(`/equipment/${equipment.id}`)}
        />
      ))}
    </div>
  );
}

export default Home;
