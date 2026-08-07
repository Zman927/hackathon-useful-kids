import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { request } from "../../api/apiClient";

export const COLLEGES = [];
export const DEPARTMENTS = [];

let loadPromise = null;

export function loadDepartments() {
  if (!loadPromise) {
    loadPromise = request("/departments")
      .then((data) => {
        COLLEGES.length = 0;
        DEPARTMENTS.length = 0;

        if (Array.isArray(data)) {
          data.forEach(({ college, departments }) => {
            COLLEGES.push({ college, departments });
            departments.forEach((d) => DEPARTMENTS.push(d));
          });
        }
        return COLLEGES;
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }
  return loadPromise;
}

export function getDepartmentName(departmentId) {
  const found = DEPARTMENTS.find((d) => d.id === Number(departmentId));
  return found ? found.name : "";
}

export function findDepartmentIdByName(name) {
  const found = DEPARTMENTS.find((d) => d.name === name);
  return found ? found.id : null;
}

function DepartmentSelect() {
  const { selectedDepartmentId, setSelectedDepartmentId } = useApp();
  const [colleges, setColleges] = useState(COLLEGES);
  const [activeCollege, setActiveCollege] = useState(COLLEGES[0]?.college ?? "");
  const navigate = useNavigate();

  function handleSelectDepartment(deptId) {
    setSelectedDepartmentId(deptId);
    navigate("/");
  }

  useEffect(() => {
    loadDepartments()
      .then((updated) => {
        setColleges([...updated]);
        setActiveCollege((current) => current || updated[0]?.college || "");
      })
      .catch(() => {});
  }, []);

  const activeDepartments =
    colleges.find((c) => c.college === activeCollege)?.departments ?? [];

  return (
    <div className="dropdown-group relative">
      <button className="flex items-center gap-2 py-5 font-medium text-gray-700 hover:text-home-primary">
        <i className="fa-solid fa-graduation-cap" />
        학과 / 학부
      </button>
      <div className="dropdown-menu absolute top-full left-1/2 z-50 hidden max-h-[420px] w-[480px] -translate-x-1/2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex">
          <div className="max-h-[420px] w-40 shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50 py-2">
            {colleges.map(({ college }, index) => (
              <button
                key={`${college}-${index}`}
                onClick={() => setActiveCollege(college)}
                className={`block w-full border-l-4 px-4 py-3 text-left text-sm font-bold transition-colors ${
                  college === activeCollege
                    ? "border-home-primary bg-home-secondary text-home-primary"
                    : "border-transparent text-gray-600 hover:text-home-primary"
                }`}
              >
                {college}
              </button>
            ))}
          </div>
          <div className="max-h-[420px] flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {activeDepartments.map((department) => (
                <button
                  key={department.id}
                  onClick={() => handleSelectDepartment(department.id)}
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
