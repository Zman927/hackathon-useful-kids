import Badge from "../common/Badge";

const STATUS_LABELS = {
  pending: "심사중",
  rented: "대여중",
  returned: "반납완료",
};

function RentalHistoryItem({ rental }) {
  return (
    <div className="grid grid-cols-1 gap-md border-b border-[#EBECF0] p-md last:border-0 md:grid-cols-12 md:items-center">
      <div className="md:col-span-8">
        <h3 className="mb-1 text-[16px] font-headline-md text-on-surface">
          {rental.equipmentName}
        </h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant">
          {rental.startDate} ~ {rental.endDate}
        </p>
      </div>
      <div className="flex justify-start md:col-span-4 md:justify-end">
        <Badge
          label={STATUS_LABELS[rental.status] || rental.status}
          variant={rental.status}
        />
      </div>
    </div>
  );
}

export default RentalHistoryItem;
