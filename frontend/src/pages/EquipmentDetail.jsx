import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEquipmentDetail } from "../api/equipmentApi";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import LoginPromptModal from "../components/common/LoginPromptModal";

function EquipmentDetail() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleRentalClick() {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/rental/${id}`);
  }

  useEffect(() => {
    setError("");
    getEquipmentDetail(id)
      .then(setEquipment)
      .catch(() => setError("기자재 정보를 불러오지 못했습니다."));
  }, [id]);

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!equipment) {
    return <EmptyState message="불러오는 중..." />;
  }

  return (
    <div className="flex flex-col gap-lg">
      <button
        onClick={() => navigate("/")}
        className="group flex w-fit items-center text-on-surface-variant transition-colors hover:text-primary"
      >
        <span className="material-symbols-outlined mr-xs text-[20px] transition-transform group-hover:-translate-x-1">
          arrow_back
        </span>
        <span className="text-label-sm font-label-sm">목록으로</span>
      </button>

      <div className="grid grid-cols-1 gap-lg md:grid-cols-12 lg:gap-xl">
        <div className="md:col-span-7">
          <div className="aspect-4/3 w-full overflow-hidden rounded-xl border border-secondary-fixed bg-surface-container-lowest">
            <img
              src={equipment.imageUrl}
              alt={equipment.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col md:col-span-5">
          <div className="mb-md">
            <div className="mb-sm flex items-center justify-between">
              <span className="text-label-sm font-label-sm tracking-wider text-primary uppercase font-bold">
                {equipment.category}
              </span>
              <Badge
                label={equipment.isAvailable ? "대여가능" : "대여불가"}
                variant={equipment.isAvailable ? "available" : "unavailable"}
              />
            </div>
            <h1 className="mb-xs text-headline-lg-mobile font-headline-lg-mobile text-on-surface md:text-headline-lg md:font-headline-lg">
              {equipment.name}
            </h1>
            <div className="mt-1 mb-md">
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                <i className="fa-solid fa-graduation-cap text-xs" />
                소속 학과: {equipment.departmentName}
              </span>
            </div>
            <p className="mt-sm text-body-lg font-body-lg leading-relaxed text-on-surface-variant">
              {equipment.description}
            </p>
          </div>

          <div className="my-md h-px w-full bg-secondary-fixed" />

          <div className="flex-grow" />

          <div className="rounded-xl border border-secondary-fixed bg-surface-container-lowest p-md shadow-sm">
            <button
              disabled={!equipment.isAvailable}
              onClick={handleRentalClick}
              className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary-container px-lg py-sm text-label-lg font-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-outline disabled:active:scale-100"
            >
              <span className="material-symbols-outlined">
                shopping_cart_checkout
              </span>
              대여 신청하기
            </button>
          </div>
        </div>
      </div>

      {showLoginPrompt && (
        <LoginPromptModal
          onCancel={() => setShowLoginPrompt(false)}
          onConfirm={() =>
            navigate("/login", { state: { from: `/rental/${id}` } })
          }
        />
      )}
    </div>
  );
}

export default EquipmentDetail;
