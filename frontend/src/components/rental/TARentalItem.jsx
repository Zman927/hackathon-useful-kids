const STATUS_LABELS = {
  pending: "Pending",
  rented: "Approved",
  rejected: "Rejected",
  returned: "Returned",
};

const STATUS_CLASSES = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  rented: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  returned: "bg-gray-100 text-gray-700 border-gray-200",
};

function getAvatarInitials(name) {
  if (!name) return "ST";
  return name.slice(0, 2).toUpperCase();
}

function TARentalItem({ rental, onApprove, onReject }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-100 p-4 transition-colors hover:bg-gray-50/50 last:border-0">
      {/* STUDENT */}
      <div className="col-span-2.5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          {getAvatarInitials(rental.studentName)}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-bold text-gray-900 truncate">
            {rental.studentName}
          </h4>
          <p className="text-xs text-gray-500 font-mono">{rental.studentId}</p>
        </div>
      </div>

      {/* DEPARTMENT */}
      <div className="col-span-2 text-sm font-medium text-gray-700 truncate">
        {rental.studentDepartment || rental.departmentName}
      </div>

      {/* EQUIPMENT NAME & PURPOSE */}
      <div className="col-span-3 flex items-center gap-3">
        <img
          src={rental.equipmentImageUrl}
          alt={rental.equipmentName}
          className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 object-cover"
        />
        <div className="overflow-hidden">
          <h4 className="text-sm font-bold text-gray-900 truncate">
            {rental.equipmentName}
          </h4>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                STATUS_CLASSES[rental.status] || STATUS_CLASSES.pending
              }`}
            >
              {STATUS_LABELS[rental.status] || rental.status}
            </span>
            <span className="text-xs text-gray-500">
              ({rental.quantity ?? 1}개)
            </span>
          </div>
          {rental.purpose && (
            <p
              className="mt-1 text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate"
              title={`대여 사유: ${rental.purpose}`}
            >
              💬 사유: {rental.purpose}
            </p>
          )}
        </div>
      </div>

      {/* RENTAL PERIOD */}
      <div className="col-span-2 text-xs font-medium text-gray-700 leading-snug">
        {rental.startDate} -<br />
        {rental.endDate}
      </div>

      {/* REQUEST DATE */}
      <div className="col-span-1.5 text-xs text-gray-500 font-medium">
        {rental.createdAt}
      </div>

      {/* ACTIONS */}
      <div className="col-span-1 flex items-center justify-end gap-1.5">
        {rental.status === "pending" ? (
          <>
            <button
              type="button"
              onClick={() => onReject(rental.id)}
              className="rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 cursor-pointer shadow-sm"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove(rental.id)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 cursor-pointer shadow-sm"
            >
              Approve
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400 font-medium">처리 완료</span>
        )}
      </div>
    </div>
  );
}

export default TARentalItem;
