import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createRental } from "../api/rentalApi";

function Rental() {
  const { id } = useParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isValid = startDate && endDate && quantity > 0 && purpose.trim() !== "";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await createRental({
        equipmentId: id,
        startDate,
        endDate,
        quantity,
        purpose,
      });
      navigate("/mypage");
    } catch (err) {
      setError("대여 신청에 실패했습니다.");
    }
  }

  return (
    <div style={{ maxWidth: "400px" }}>
      <h1>대여 신청</h1>
      <form onSubmit={handleSubmit}>
        <label>
          시작일
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          반납일
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label>
          수량
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
        <label>
          사용 목적
          <textarea
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          />
        </label>
        <button type="submit" disabled={!isValid}>
          신청하기
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

export default Rental;
