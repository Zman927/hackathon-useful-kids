import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEquipmentDetail } from "../api/equipmentApi";
import Badge from "../components/common/Badge";

function EquipmentDetail() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setError("");
    getEquipmentDetail(id)
      .then(setEquipment)
      .catch(() => setError("기자재 정보를 불러오지 못했습니다."));
  }, [id]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!equipment) {
    return <p>불러오는 중...</p>;
  }

  return (
    <div>
      <button onClick={() => navigate("/")}>← 목록으로</button>
      <img
        src={equipment.imageUrl}
        alt={equipment.name}
        style={{ width: "100%", maxWidth: "400px" }}
      />
      <h1>{equipment.name}</h1>
      <p>{equipment.category}</p>
      <p>{equipment.description}</p>
      <Badge
        label={equipment.isAvailable ? "대여가능" : "대여불가"}
        variant={equipment.isAvailable ? "available" : "unavailable"}
      />
      <div>
        <button
          disabled={!equipment.isAvailable}
          onClick={() => navigate(`/rental/${equipment.id}`)}
        >
          대여신청
        </button>
      </div>
    </div>
  );
}

export default EquipmentDetail;
