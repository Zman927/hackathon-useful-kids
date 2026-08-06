import { Outlet } from "react-router-dom";
import Header from "./Header";

function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-gutter pt-[96px] pb-xl md:px-xl">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
