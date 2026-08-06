import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DepartmentSelect from "../equipment/DepartmentSelect";

function Header() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-gutter">
        <div className="flex items-center gap-xl">
          <Link
            to="/"
            className="flex items-center gap-sm text-headline-md font-headline-md font-bold text-primary"
          >
            <span className="material-symbols-outlined">build</span>
            MJC 기자재 대여
          </Link>
          <DepartmentSelect />
        </div>
        <Link
          to="/mypage"
          className="flex items-center gap-xs text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span className="hidden text-label-lg font-label-lg md:inline">
            {user ? user.userName : "마이페이지"}
          </span>
        </Link>
      </div>
    </header>
  );
}

export default Header;
