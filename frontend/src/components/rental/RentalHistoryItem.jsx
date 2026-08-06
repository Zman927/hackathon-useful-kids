const STATUS_LABELS = {
  pending: "심사중",
  rented: "대여중",
  returned: "반납완료",
};

const STATUS_CLASSES = {
  pending: "bg-home-warning text-home-warning-text",
  rented: "bg-home-success text-home-success-text",
  returned: "bg-gray-100 text-gray-600",
};

function RentalHistoryItem({ rental, onCancel }) {
  return (
    <div className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 p-4 last:border-0">
      <div className="col-span-4 flex items-center gap-4">
        <img
          src={rental.equipmentImageUrl}
          alt={rental.equipmentName}
          className="h-14 w-14 rounded object-cover"
        />
        <div>
          <h3 className="font-bold text-gray-900">{rental.equipmentName}</h3>
          <p className="text-xs text-gray-500">
            Category: {rental.equipmentCategory}
          </p>
          {rental.departmentName && (
            <p className="mt-0.5 text-xs font-semibold text-blue-600 flex items-center gap-1">
              <i className="fa-solid fa-graduation-cap text-[10px]" />
              {rental.departmentName}
            </p>
          )}
        </div>
      </div>
      <div className="col-span-1 text-center font-semibold text-gray-800 text-sm">
        {rental.quantity ?? 1}개
      </div>
      <div className="col-span-2 text-sm text-gray-700">
        {rental.createdAt}
      </div>
      <div className="col-span-3 text-sm text-gray-700">
        {rental.startDate} - {rental.endDate}
      </div>
      <div className="col-span-2 flex items-center justify-end gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASSES[rental.status] || STATUS_CLASSES.pending}`}
        >
          {STATUS_LABELS[rental.status] || rental.status}
        </span>
        {rental.status === "pending" && (
          <button
            type="button"
            onClick={() => onCancel(rental.id)}
            className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 cursor-pointer shrink-0"
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}

export default RentalHistoryItem;
