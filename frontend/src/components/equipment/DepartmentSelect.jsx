import { useApp } from "../../context/AppContext";

export const DEPARTMENTS = [
  { id: 1, name: "컴퓨터공학과" },
  { id: 2, name: "전자공학과" },
  { id: 3, name: "기계공학과" },
  { id: 4, name: "화학공학과" },
];

const COLLEGE_NAME = "공과대학";

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
      <div className="dropdown-menu absolute top-full left-1/2 z-50 hidden w-[420px] -translate-x-1/2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex">
          <div className="w-36 shrink-0 border-r border-gray-100 bg-gray-50 py-2">
            <div className="border-l-4 border-home-primary bg-home-secondary px-4 py-3 text-sm font-bold text-home-primary">
              {COLLEGE_NAME}
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {DEPARTMENTS.map((department) => (
                <button
                  key={department.id}
                  onClick={() => setSelectedDepartmentId(department.id)}
                  className={`rounded px-2 py-1 text-left text-sm transition-colors ${
                    department.id === selectedDepartmentId
                      ? "bg-home-secondary font-bold text-home-primary"
                      : "text-gray-700 hover:text-home-primary"
                  }`}
                >
                  {department.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentSelect;
