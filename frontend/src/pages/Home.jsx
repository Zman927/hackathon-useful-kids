import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getEquipmentList } from "../api/equipmentApi";
import EquipmentCard from "../components/equipment/EquipmentCard";
import DepartmentSelect, {
  DEPARTMENTS,
} from "../components/equipment/DepartmentSelect";
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

  const departmentName = DEPARTMENTS.find(
    (department) => department.id === selectedDepartmentId,
  )?.name;
  const trendingEquipment = equipmentList.slice(0, 3);

  return (
    <div className="flex flex-col gap-lg">
      <div className="mb-xl flex flex-col items-center justify-between gap-lg rounded-xl border border-secondary-fixed bg-surface-container-lowest p-lg shadow-sm">
        <div className="flex w-full flex-col items-center gap-lg md:flex-row">
          <div className="flex items-center border-outline-variant pr-lg md:border-r">
            <DepartmentSelect />
          </div>
          <div className="input-focus relative flex w-full items-center rounded-lg border border-outline-variant bg-surface-bright px-md py-sm transition-all">
            <span className="material-symbols-outlined mr-sm text-secondary">
              search
            </span>
            <input
              type="text"
              placeholder="기자재 이름으로 검색..."
              className="w-full border-none bg-transparent text-body-lg font-body-lg text-on-surface placeholder:text-secondary-fixed-dim focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {selectedDepartmentId && trendingEquipment.length > 0 && (
        <div className="mb-xl flex flex-col gap-lg rounded-xl bg-[#edf1ff] p-lg shadow-sm">
          <h2 className="text-headline-md font-bold text-on-surface">
            {departmentName}의 핫한 기자재! 🔥
          </h2>
          <div className="grid grid-cols-1 gap-md md:grid-cols-3">
            {trendingEquipment.map((equipment) => (
              <div
                key={equipment.id}
                onClick={() => navigate(`/equipment/${equipment.id}`)}
                className="card-hover flex flex-1 cursor-pointer items-center gap-sm rounded-lg border border-secondary-fixed bg-surface-container-lowest p-sm shadow-sm"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-surface-variant">
                  <span className="material-symbols-outlined text-secondary">
                    star
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-label-lg text-on-surface">
                    {equipment.name}
                  </h4>
                  <span className="mt-xs inline-block rounded-sm bg-primary-container/20 px-xs py-0.5 font-label-sm text-primary">
                    Popular
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-lg flex flex-wrap justify-end gap-sm">
        <button className="rounded-full border border-primary bg-primary px-md py-sm text-label-lg font-label-lg text-on-primary transition-colors">
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

      {!selectedDepartmentId && <EmptyState message="학과를 선택해주세요." />}

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
