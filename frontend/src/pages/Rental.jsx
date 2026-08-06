import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEquipmentDetail } from "../api/equipmentApi";
import { createRental } from "../api/rentalApi";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "../components/common/LoginPromptModal";

function Rental() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getEquipmentDetail(id)
      .then(setEquipment)
      .catch(() => setEquipment(null));
  }, [id]);

  if (!user) {
    return (
      <LoginPromptModal
        onCancel={() => navigate(`/equipment/${id}`)}
        onConfirm={() => navigate("/login", { state: { from: `/rental/${id}` } })}
      />
    );
  }

  const isDateOrderValid = !startDate || !endDate || endDate >= startDate;
  const isValid =
    startDate &&
    endDate &&
    isDateOrderValid &&
    quantity > 0 &&
    purpose.trim() !== "";

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    const max = equipment?.remainingQuantity ?? 99;
    setQuantity((current) => Math.min(max, current + 1));
  }

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
    <div className="mx-auto flex max-w-3xl flex-col gap-lg">
      <header className="flex items-center gap-sm">
        <button
          onClick={() => navigate(`/equipment/${id}`)}
          className="flex items-center rounded-full p-xs text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-lg font-headline-lg text-on-surface">
          기기 대여 신청
        </h1>
      </header>

      <div className="flex flex-col gap-xl rounded-xl border border-secondary-fixed bg-surface-container-lowest p-lg shadow-[0px_4px_12px_rgba(9,30,66,0.04)] md:p-xl">
        {equipment && (
          <section className="flex items-start gap-md rounded-lg border border-secondary-fixed bg-surface-container-low p-md">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-secondary-fixed bg-white">
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-xs pt-xs">
              <h2 className="text-headline-md font-headline-md text-on-surface">
                {equipment.name}
              </h2>
              <div className="flex items-center gap-sm text-label-sm font-label-sm text-on-surface-variant">
                <span>분류: {equipment.category}</span>
                <span>•</span>
                <span>소속 학과: {equipment.departmentName}</span>
              </div>
            </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="start_date"
                className="text-label-lg font-label-lg text-on-surface"
              >
                대여 시작일 <span className="text-error">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="end_date"
                className="text-label-lg font-label-lg text-on-surface"
              >
                반납 예정일 <span className="text-error">*</span>
              </label>
              <input
                id="end_date"
                type="date"
                required
                min={startDate || undefined}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {!isDateOrderValid && (
                <p className="text-label-sm font-label-sm text-error">
                  반납 예정일은 대여 시작일보다 빠를 수 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-lg font-label-lg text-on-surface">
              수량 <span className="text-error">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex w-fit items-center overflow-hidden rounded-lg border border-outline-variant transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  className="flex h-10 w-10 items-center justify-center border-r border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    remove
                  </span>
                </button>
                <input
                  type="number"
                  min="1"
                  readOnly
                  value={quantity}
                  className="h-10 w-16 border-none bg-transparent text-center text-body-md font-body-md text-on-surface focus:ring-0"
                />
                <button
                  type="button"
                  onClick={increaseQuantity}
                  className="flex h-10 w-10 items-center justify-center border-l border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add
                  </span>
                </button>
              </div>
              {equipment && (
                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                  남은 수량: <strong className="text-blue-600">{equipment.remainingQuantity ?? 5}</strong>개
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label
              htmlFor="purpose"
              className="text-label-lg font-label-lg text-on-surface"
            >
              사용 목적 <span className="text-error">*</span>
            </label>
            <textarea
              id="purpose"
              rows="4"
              required
              placeholder="프로젝트명, 실험 내용 등 기기 대여 목적을 상세히 작성해 주세요."
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="min-h-[120px] w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-md text-body-md font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <hr className="mt-sm border-secondary-fixed" />

          <div className="flex items-center justify-end gap-sm pt-sm">
            <button
              type="button"
              onClick={() => navigate(`/equipment/${id}`)}
              className="rounded-lg px-lg py-sm text-label-lg font-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex items-center gap-xs rounded-lg bg-primary px-lg py-sm text-label-lg font-label-lg text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-outline"
            >
              신청하기
            </button>
          </div>

          {error && (
            <p className="text-label-sm font-label-sm text-error">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Rental;
