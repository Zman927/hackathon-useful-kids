import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-gutter">
        <Link
          to="/"
          className="flex items-center gap-sm text-headline-md font-headline-md font-bold text-primary"
        >
          <span className="material-symbols-outlined">build</span>
          MJC 기자재 대여
        </Link>
        <div className="flex items-center gap-md">
          <Link
            to="/"
            className="flex items-center gap-xs text-label-lg font-label-lg text-on-surface transition-colors duration-200 hover:text-primary"
          >
            <span className="material-symbols-outlined">home</span>
            <span>홈</span>
          </Link>
          <Link
            to="/mypage"
            className="flex items-center gap-xs text-label-lg font-label-lg text-on-surface transition-colors duration-200 hover:text-primary"
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span>마이페이지</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
