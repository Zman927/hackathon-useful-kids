import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyRentals } from "../api/rentalApi";
import RentalHistoryItem from "../components/rental/RentalHistoryItem";
import AppHeader from "../components/layout/AppHeader";
import EmptyState from "../components/common/EmptyState";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "심사중" },
  { value: "rented", label: "대여중" },
  { value: "returned", label: "반납완료" },
];

function MyPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      return;
    }

    setError("");
    getMyRentals(user.userId)
      .then(setRentals)
      .catch(() => setError("대여 내역을 불러오지 못했습니다."));
  }, [user]);

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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-home-secondary">
            <i className="fa-solid fa-user text-2xl text-home-primary" />
          </div>
          <div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">
              {user.userName}
            </h1>
            <p className="flex items-center gap-2 text-gray-500">
              <i className="fa-solid fa-id-badge" />
              Student ID: {user.userId}
            </p>
          </div>
        </section>

        {error && <EmptyState message={error} />}

        {!error && (
          <section>
            <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <h2 className="text-xl font-bold text-gray-900">
                대여 내역 (Rental History)
              </h2>
              <div className="flex items-center gap-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeFilter === filter.value
                        ? "bg-home-primary text-white"
                        : "text-gray-600 hover:text-home-primary"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredRentals.length === 0 ? (
              <EmptyState message="아직 신청한 대여가 없어요." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-4 bg-home-secondary p-4 text-sm font-bold text-gray-700">
                  <div className="col-span-5">기자재 정보</div>
                  <div className="col-span-2">신청 날짜</div>
                  <div className="col-span-3">대여 기간</div>
                  <div className="col-span-2 text-right">상태</div>
                </div>
                {filteredRentals.map((rental) => (
                  <RentalHistoryItem key={rental.id} rental={rental} />
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
