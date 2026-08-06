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

function RentalHistoryItem({ rental }) {
  return (
    <div className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 p-4 last:border-0">
      <div className="col-span-5 flex items-center gap-4">
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
        </div>
      </div>
      <div className="col-span-2 text-sm text-gray-700">
        {rental.createdAt}
      </div>
      <div className="col-span-3 text-sm text-gray-700">
        {rental.startDate} - {rental.endDate}
      </div>
      <div className="col-span-2 flex justify-end">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASSES[rental.status] || STATUS_CLASSES.pending}`}
        >
          {STATUS_LABELS[rental.status] || rental.status}
        </span>
      </div>
    </div>
  );
}

export default RentalHistoryItem;
