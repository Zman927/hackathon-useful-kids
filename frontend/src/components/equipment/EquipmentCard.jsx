function EquipmentCard({ equipment, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`rounded px-2 py-1 text-xs font-bold ${
            equipment.isAvailable
              ? "bg-home-success text-home-success-text"
              : "bg-home-warning text-home-warning-text"
          }`}
        >
          {equipment.isAvailable ? "대여 가능" : "대여 불가"}
        </span>
      </div>
      <div className="flex flex-grow flex-col p-4">
        <div className="mb-4 flex h-32 items-center justify-center">
          <img
            src={equipment.imageUrl}
            alt={equipment.name}
            className="max-h-full object-contain"
          />
        </div>
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          {equipment.name}
        </h3>
        <p className="mb-4 text-xs text-gray-500">{equipment.category}</p>
        <div className="mt-auto border-t border-gray-100 pt-3 text-right">
          <span className="text-sm font-bold text-home-primary hover:underline">
            자세히 보기
          </span>
        </div>
      </div>
    </div>
  );
}

export default EquipmentCard;
