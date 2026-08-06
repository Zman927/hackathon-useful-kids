import Badge from "../common/Badge";

function EquipmentCard({ equipment, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        cursor: "pointer",
      }}
    >
      <img
        src={equipment.imageUrl}
        alt={equipment.name}
        style={{ width: "100%", height: "140px", objectFit: "cover" }}
      />
      <h3>{equipment.name}</h3>
      <p>{equipment.category}</p>
      <Badge
        label={equipment.isAvailable ? "대여가능" : "대여불가"}
        variant={equipment.isAvailable ? "available" : "unavailable"}
      />
    </div>
  );
}

export default EquipmentCard;
