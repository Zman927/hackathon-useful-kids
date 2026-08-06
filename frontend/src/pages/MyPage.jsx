import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyRentals,
  getAllRentals,
  approveRental,
  rejectRental,
  cancelRental,
} from "../api/rentalApi";
import RentalHistoryItem from "../components/rental/RentalHistoryItem";
import TARentalItem from "../components/rental/TARentalItem";
import AppHeader from "../components/layout/AppHeader";
import EmptyState from "../components/common/EmptyState";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "심사중" },
  { value: "rented", label: "대여중" },
  { value: "returned", label: "반납완료" },
];

function MyPage() {
  const { user, logout } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  const isTA =
    user &&
    (user.role === "admin" ||
      user.userId?.toLowerCase().includes("admin") ||
      user.userId?.toLowerCase().includes("ta") ||
      user.userName?.includes("조교"));

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleCancelRental(rentalId) {
    if (!window.confirm("대여 신청을 취소하시겠습니까?")) {
      return;
    }

    try {
      await cancelRental(rentalId);
      setRentals((prev) => prev.filter((r) => r.id !== rentalId));
    } catch (err) {
      alert("대여 신청 취소에 실패했습니다.");
    }
  }

  async function handleApprove(rentalId) {
    try {
      await approveRental(rentalId);
      setRentals((prev) =>
        prev.map((r) => (r.id === rentalId ? { ...r, status: "rented" } : r)),
      );
    } catch (err) {
      alert("승인 처리에 실패했습니다.");
    }
  }

  async function handleReject(rentalId) {
    if (!window.confirm("이 대여 신청을 거절하시겠습니까?")) {
      return;
    }
    try {
      await rejectRental(rentalId);
      setRentals((prev) =>
        prev.map((r) => (r.id === rentalId ? { ...r, status: "rejected" } : r)),
      );
    } catch (err) {
      alert("거절 처리에 실패했습니다.");
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    setError("");
    const fetchFunc = isTA ? getAllRentals : () => getMyRentals(user.userId);
    fetchFunc()
      .then(setRentals)
      .catch(() => setError("대여 내역을 불러오지 못했습니다."));
  }, [user, isTA]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f5f7]">
        <AppHeader />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <EmptyState message="로그인이 필요합니다." />
        </div>
      </div>
    );
  }

  const filteredRentals =
    activeFilter === "all"
      ? rentals
      : rentals.filter((rental) => rental.status === activeFilter);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-800 antialiased">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Card Header */}
        <section className="mb-8 flex items-center justify-between gap-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <i
                className={`fa-solid ${
                  isTA ? "fa-shield-halved text-3xl" : "fa-user text-2xl text-home-primary"
                }`}
              />
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-bold text-gray-900">
                {isTA ? `${user.userName} (실습/행정)` : user.userName}
              </h1>
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <i className="fa-solid fa-id-badge" />
                {isTA ? "Staff ID: " : "Student ID: "}
                {user.userId}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket" />
            로그아웃
          </button>
        </section>

        {error && <EmptyState message={error} />}

        {!error && (
          <section>
            <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {isTA ? "기자재 관리 및 대여 현황" : "대여 내역 (Rental History)"}
              </h2>
              <div className="flex items-center gap-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                      activeFilter === filter.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:text-blue-600"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredRentals.length === 0 ? (
              <EmptyState message="대여 신청 내역이 없습니다." />
            ) : isTA ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-3 bg-gray-50/80 border-b border-gray-200 p-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  <div className="col-span-2.5">STUDENT</div>
                  <div className="col-span-2">DEPARTMENT</div>
                  <div className="col-span-3">EQUIPMENT NAME</div>
                  <div className="col-span-2">RENTAL PERIOD</div>
                  <div className="col-span-1.5">REQUEST DATE</div>
                  <div className="col-span-1 text-right">ACTIONS</div>
                </div>
                {filteredRentals.map((rental) => (
                  <TARentalItem
                    key={rental.id}
                    rental={rental}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-50 p-4 text-sm font-bold text-gray-700">
                  <div className="col-span-4">기자재 정보</div>
                  <div className="col-span-1 text-center">수량</div>
                  <div className="col-span-2">신청 날짜</div>
                  <div className="col-span-3">대여 기간</div>
                  <div className="col-span-2 text-right">상태 / 관리</div>
                </div>
                {filteredRentals.map((rental) => (
                  <RentalHistoryItem
                    key={rental.id}
                    rental={rental}
                    onCancel={handleCancelRental}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default MyPage;
