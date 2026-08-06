import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";

function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1200px] px-gutter py-xl md:px-xl">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
