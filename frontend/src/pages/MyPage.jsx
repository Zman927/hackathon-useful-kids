import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyRentals } from "../api/rentalApi";
import RentalHistoryItem from "../components/rental/RentalHistoryItem";
import EmptyState from "../components/common/EmptyState";

function MyPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [error, setError] = useState("");

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

  if (rentals.length === 0) {
    return <EmptyState message="아직 신청한 대여가 없어요." />;
  }

  return (
    <div>
      <h1>{user.userName}님의 대여 내역</h1>
      {rentals.map((rental) => (
        <RentalHistoryItem key={rental.id} rental={rental} />
      ))}
    </div>
  );
}

export default MyPage;
