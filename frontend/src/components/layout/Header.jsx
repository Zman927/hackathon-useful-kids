import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DepartmentSelect from "../equipment/DepartmentSelect";

function Header() {
  const { user } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid #eee",
      }}
    >
      <Link to="/">기자재 대여</Link>
      <DepartmentSelect />
      <Link to="/mypage">{user ? user.userName : "마이페이지"}</Link>
    </header>
  );
}

export default Header;
