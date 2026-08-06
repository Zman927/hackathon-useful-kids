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

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col items-center justify-between gap-lg rounded-xl border border-secondary-fixed bg-surface-container-lowest p-lg shadow-sm md:flex-row">
        <div className="input-focus flex w-full items-center rounded-lg border border-outline-variant bg-surface-bright px-md py-sm transition-all md:w-1/2">
          <span className="material-symbols-outlined mr-sm text-secondary">
            search
          </span>
          <input
            type="text"
            placeholder="기자재 이름으로 검색..."
            className="w-full border-none bg-transparent text-body-lg font-body-lg text-on-surface placeholder:text-secondary-fixed-dim focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="flex w-full flex-wrap gap-sm md:w-auto">
          <button className="rounded-full border border-primary-container bg-primary-container px-md py-sm text-label-lg font-label-lg text-on-primary transition-colors">
            전체
          </button>
          <button className="rounded-full border border-outline-variant bg-surface-bright px-md py-sm text-label-lg font-label-lg text-on-surface-variant transition-colors hover:border-primary">
            카메라/영상
          </button>
          <button className="rounded-full border border-outline-variant bg-surface-bright px-md py-sm text-label-lg font-label-lg text-on-surface-variant transition-colors hover:border-primary">
            오디오
          </button>
          <button className="rounded-full border border-outline-variant bg-surface-bright px-md py-sm text-label-lg font-label-lg text-on-surface-variant transition-colors hover:border-primary">
            IT 기기
          </button>
        </div>
      </div>

      {!selectedDepartmentId && (
        <EmptyState message="학과를 선택해주세요." />
      )}

      {selectedDepartmentId && error && <EmptyState message={error} />}

      {selectedDepartmentId && !error && equipmentList.length === 0 && (
        <EmptyState message="대여 가능한 기자재가 없습니다." />
      )}

      {selectedDepartmentId && !error && equipmentList.length > 0 && (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
          {equipmentList.map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              onClick={() => navigate(`/equipment/${equipment.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
