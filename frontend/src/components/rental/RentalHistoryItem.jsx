import Badge from "../common/Badge";

const STATUS_LABELS = {
  pending: "심사중",
  rented: "대여중",
  returned: "반납완료",
};

function RentalHistoryItem({ rental }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div>
        <p>{rental.equipmentName}</p>
        <p style={{ fontSize: "12px", color: "#888" }}>
          {rental.startDate} ~ {rental.endDate}
        </p>
      </div>
      <Badge
        label={STATUS_LABELS[rental.status] || rental.status}
        variant={rental.status}
      />
    </div>
  );
}

export default RentalHistoryItem;
