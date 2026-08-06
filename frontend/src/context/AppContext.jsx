import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  return (
    <AppContext.Provider
      value={{ selectedDepartmentId, setSelectedDepartmentId }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
