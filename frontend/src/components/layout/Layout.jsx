import { Outlet } from "react-router-dom";
import Header from "./Header";

function Layout() {
  return (
    <div>
      <Header />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
