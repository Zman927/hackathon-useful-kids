import Badge from "../common/Badge";

function EquipmentCard({ equipment, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card-hover flex cursor-pointer flex-col gap-md rounded-lg border border-secondary-fixed bg-surface-container-lowest p-md"
    >
      <div className="flex items-start justify-between">
        <img
          src={equipment.imageUrl}
          alt={equipment.name}
          className="h-16 w-16 rounded bg-surface-variant object-cover"
        />
        <Badge
          label={equipment.isAvailable ? "대여 가능" : "대여 불가"}
          variant={equipment.isAvailable ? "available" : "unavailable"}
        />
      </div>
      <div>
        <h3 className="mb-xs text-headline-md font-headline-md text-on-surface">
          {equipment.name}
        </h3>
        <p className="text-label-sm font-label-sm text-secondary">
          {equipment.category}
        </p>
      </div>
      <div className="mt-auto flex justify-end border-t border-secondary-fixed pt-sm">
        <span className="text-label-lg font-label-lg text-primary">
          자세히 보기
        </span>
      </div>
    </div>
  );
}

export default EquipmentCard;
