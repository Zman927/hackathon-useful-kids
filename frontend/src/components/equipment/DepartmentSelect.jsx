import { useApp } from "../../context/AppContext";

export const DEPARTMENTS = [
  { id: 1, name: "컴퓨터공학과" },
  { id: 2, name: "전자공학과" },
  { id: 3, name: "기계공학과" },
  { id: 4, name: "화학공학과" },
];

function DepartmentSelect() {
  const { selectedDepartmentId, setSelectedDepartmentId } = useApp();
  const selectedName = DEPARTMENTS.find(
    (department) => department.id === selectedDepartmentId,
  )?.name;

  return (
    <div className="dropdown-group relative">
      <button className="flex items-center gap-2 py-5 font-medium text-gray-700 hover:text-home-primary">
        <i className="fa-solid fa-graduation-cap" />
        {selectedName ?? "학과 선택"}
      </button>
      <div className="dropdown-menu absolute top-full left-1/2 z-50 hidden w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
        <h3 className="mb-2 border-b border-gray-100 pb-2 font-bold text-gray-800">
          학과 선택
        </h3>
        <ul className="space-y-1 text-sm text-gray-600">
          {DEPARTMENTS.map((department) => (
            <li
              key={department.id}
              onClick={() => setSelectedDepartmentId(department.id)}
              className={`cursor-pointer rounded p-1 hover:text-home-primary ${
                department.id === selectedDepartmentId
                  ? "bg-home-secondary font-bold text-home-primary"
                  : ""
              }`}
            >
              {department.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DepartmentSelect;
