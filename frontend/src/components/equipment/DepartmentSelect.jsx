import { useApp } from "../../context/AppContext";

const DEPARTMENTS = [
  { id: 1, name: "컴퓨터공학과" },
  { id: 2, name: "전자공학과" },
  { id: 3, name: "기계공학과" },
  { id: 4, name: "화학공학과" },
];

function DepartmentSelect() {
  const { selectedDepartmentId, setSelectedDepartmentId } = useApp();

  function handleChange(event) {
    const value = event.target.value;
    setSelectedDepartmentId(value ? Number(value) : null);
  }

  return (
    <select value={selectedDepartmentId ?? ""} onChange={handleChange}>
      <option value="">학과 선택</option>
      {DEPARTMENTS.map((department) => (
        <option key={department.id} value={department.id}>
          {department.name}
        </option>
      ))}
    </select>
  );
}

export default DepartmentSelect;
