import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyRentals } from "../api/rentalApi";
import RentalHistoryItem from "../components/rental/RentalHistoryItem";
import EmptyState from "../components/common/EmptyState";

const FILTERS = [
  { value: "all", label: "전체" },
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
    return <EmptyState message="로그인이 필요합니다." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  const filteredRentals =
    activeFilter === "all"
      ? rentals
      : rentals.filter((rental) => rental.status === activeFilter);

  return (
    <div className="flex flex-col gap-lg">
      <section className="flex flex-col items-center gap-lg rounded-lg border border-secondary-fixed bg-surface-container-lowest p-lg md:flex-row">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-primary">
          <span className="material-symbols-outlined text-4xl">person</span>
        </div>
        <div>
          <h1 className="mb-sm text-headline-lg-mobile font-headline-lg-mobile text-on-surface md:text-headline-lg md:font-headline-lg">
            {user.userName}
          </h1>
          <p className="flex items-center gap-2 text-body-lg font-body-lg text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">badge</span>
            학번: {user.userId}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <div className="mb-md flex flex-col items-start justify-between gap-md md:flex-row md:items-center">
          <h2 className="text-headline-md font-headline-md text-on-surface">
            대여 내역
          </h2>
          <div className="flex w-full overflow-x-auto rounded-full border border-secondary-fixed bg-surface-container-lowest p-1 md:w-auto">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-label-lg font-label-lg whitespace-nowrap transition-colors ${
                  activeFilter === filter.value
                    ? "bg-primary-container text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
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
          <div className="overflow-hidden rounded-lg border border-secondary-fixed bg-surface-container-lowest">
            {filteredRentals.map((rental) => (
              <RentalHistoryItem key={rental.id} rental={rental} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyPage;
