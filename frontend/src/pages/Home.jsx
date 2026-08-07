import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getEquipmentList } from "../api/equipmentApi";
import { getMyRentals } from "../api/rentalApi";
import EquipmentCard from "../components/equipment/EquipmentCard";
import {
  DEPARTMENTS,
  loadDepartments,
  findDepartmentIdByName,
} from "../components/equipment/DepartmentSelect";
import AppHeader from "../components/layout/AppHeader";
import EmptyState from "../components/common/EmptyState";
import AddEquipmentModal from "../components/equipment/AddEquipmentModal";

const TREND_ICONS = ["fa-flask", "fa-microscope", "fa-blender"];

function Home() {
  const { selectedDepartmentId, setSelectedDepartmentId } = useApp();
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [error, setError] = useState("");
  const [dueSoonRental, setDueSoonRental] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const isTA = user?.role === "admin";

  useEffect(() => {
    if (!user?.departmentName) {
      return;
    }
    loadDepartments().then(() => {
      const id = findDepartmentIdByName(user.departmentName);
      if (id) {
        setSelectedDepartmentId(id);
      }
    });
  }, [user, setSelectedDepartmentId]);

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

  useEffect(() => {
    if (!user || isTA) {
      setDueSoonRental(null);
      return;
    }

    getMyRentals()
      .then((rentals) => {
        const rented = rentals
          .filter((rental) => rental.status === "rented")
          .sort((a, b) => a.endDate.localeCompare(b.endDate));
        setDueSoonRental(rented[0] ?? null);
      })
      .catch(() => setDueSoonRental(null));
  }, [user]);

  const departmentName = DEPARTMENTS.find(
    (department) => department.id === selectedDepartmentId,
  )?.name;
  const trendingEquipment = equipmentList.slice(0, 3);

  const CATEGORIES = [
    "전체",
    "카메라/영상",
    "오디오",
    "IT 기기",
    "계측기",
    "드론/로보틱스",
    "마이크로컨트롤러",
  ];

  const filteredEquipmentList = equipmentList.filter((equipment) => {
    const matchesSearch = equipment.name
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
    const matchesCategory =
      selectedCategory === "전체" || equipment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#f4f5f7] text-gray-800 antialiased">
      <AppHeader />

      <main className="mx-auto max-w-5xl pb-16">
        <div className="relative mt-6 h-[300px] w-full overflow-hidden rounded-xl shadow-md">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlGr3trWhIg3mDSL-Fq8TOZAy9L2XCAq-f2W50bOIFGA3Qkhhukl7xVcL5riFMqYK4TZoeuZXMjL1xk6M7li1OSa3bKWleneNqjHKYUnH5800QHekJRl7OLSx_DrJwGV-u-UlKHNyiCtiStLN7xQlB7vJh3c8yXHd2oTXPv1WnmsZa7ewo7uzFb7ijPIQg9NKqiiZV7qtgLbGp6siP1Sq13AYshcOu0SpNPTLGvzfJkta74aTrDww7VHzCIPbrPfL5a-Q"
            alt="캠퍼스 배너"
            className="h-full w-full object-cover object-top opacity-80"
          />
        </div>

        <div className="relative z-10 -mt-6 px-8">
          <div className="flex items-center rounded-lg border border-gray-100 bg-white p-2 shadow-lg">
            <i className="fa-solid fa-search mr-3 ml-4 text-gray-400" />
            <input
              type="text"
              placeholder="기자재 이름으로 검색..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full border-none bg-transparent py-3 text-lg text-gray-700 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {dueSoonRental && (
          <div className="mt-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="mb-1 flex items-center text-lg font-bold text-gray-800">
                <i className="fa-solid fa-bell mr-2 text-home-warning-text" />
                곧 반납해야 될 기자재!
              </h3>
              <p className="text-gray-600">
                {dueSoonRental.equipmentName}의 반납 기한이{" "}
                <span className="font-bold text-error">
                  {dueSoonRental.endDate}
                </span>
                까지입니다.
              </p>
            </div>
          </div>
        )}

        {selectedDepartmentId && trendingEquipment.length > 0 && (
          <section className="mt-8 rounded-xl border border-blue-100 bg-[#f5f8ff] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              {departmentName}의 핫한 기자재!{" "}
              <span className="text-xl">🔥</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {trendingEquipment.map((equipment, index) => (
                <div
                  key={equipment.id}
                  onClick={() => navigate(`/equipment/${equipment.id}`)}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                    <i
                      className={`fa-solid ${TREND_ICONS[index % TREND_ICONS.length]} text-xl text-gray-500`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">
                      {equipment.name}
                    </h3>
                    <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Popular
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 md:mt-12">
          {selectedDepartmentId && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {departmentName} 전체 기자재 목록
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                      selectedCategory === category
                        ? "bg-home-primary text-white shadow-sm"
                        : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedDepartmentId && <EmptyState message="학과를 선택해주세요." />}

          {selectedDepartmentId && error && <EmptyState message={error} />}

          {selectedDepartmentId && !error && equipmentList.length === 0 && (
            <EmptyState message="대여 가능한 기자재가 없습니다." />
          )}

          {selectedDepartmentId &&
            !error &&
            equipmentList.length > 0 &&
            filteredEquipmentList.length === 0 && (
              <EmptyState message="검색 결과가 없습니다." />
            )}

          {selectedDepartmentId && !error && filteredEquipmentList.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEquipmentList.map((equipment) => (
                <EquipmentCard
                  key={equipment.id}
                  equipment={equipment}
                  onClick={() => navigate(`/equipment/${equipment.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {isTA && (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          title="기자재 신규 등록"
          className="fixed bottom-8 right-8 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-all duration-200 hover:bg-blue-700 hover:scale-110 active:scale-95 focus:outline-none"
        >
          <i className="fa-solid fa-plus text-2xl" />
        </button>
      )}

      {showAddModal && (
        <AddEquipmentModal
          initialDepartmentId={selectedDepartmentId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            if (selectedDepartmentId) {
              getEquipmentList(selectedDepartmentId).then(setEquipmentList);
            }
          }}
        />
      )}
    </div>
  );
}

export default Home;
