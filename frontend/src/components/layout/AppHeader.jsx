import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DepartmentSelect from "../equipment/DepartmentSelect";

function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex flex-shrink-0 items-center gap-2">
            <i className="fa-solid fa-wrench text-xl text-home-primary" />
            <span className="text-xl font-bold text-home-primary">
              MJC 기자재 대여
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-home-primary"
            >
              <i className="fa-solid fa-house" /> HOME
            </Link>
            <DepartmentSelect />
            {user ? (
              <>
                <Link
                  to="/mypage"
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-home-primary"
                >
                  <i className="fa-regular fa-circle-user text-xl" /> 마이페이지
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-right-from-bracket text-lg" /> 로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 font-medium text-gray-700 hover:text-home-primary"
              >
                <i className="fa-solid fa-right-to-bracket text-xl" /> 로그인
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
