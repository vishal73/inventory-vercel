import React, { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { List, FileText, PlusCircle, BarChart2, Sun, Moon } from "lucide-react";
import { InventoryProvider } from "./InventoryContext";
import ProductList from "./ProductList";
import InvoiceGenerator from "./InvoiceGenerator";
import ProductCreator from "./ProductCreator";
import SalesAnalytics from "./SalesAnalytics";
import { useTheme } from "./ThemeContext";
import Logger from "./Logger";
import { skaiLogo } from "./assets/skaiLogo";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Define tab configurations
const TAB_CONFIG = {
  inventory: {
    icon: List,
    component: ProductList,
    title: "Inventory",
    path: "/inventory",
  },
  invoice: {
    icon: FileText,
    component: InvoiceGenerator,
    title: "Invoice",
    path: "/invoice",
  },
  create: {
    icon: PlusCircle,
    component: ProductCreator,
    title: "Create Product",
    path: "/create",
  },
  analytics: {
    icon: BarChart2,
    component: SalesAnalytics,
    title: "Analytics",
    path: "/analytics",
  },
};

// Add this helper function to clean circular references
const cleanDataForStorage = (data) => {
  const cleaned = { ...data };

  // Clean each tab's state
  Object.keys(cleaned).forEach((tabKey) => {
    if (cleaned[tabKey]) {
      // Remove React refs and DOM elements
      const cleanedTabState = { ...cleaned[tabKey] };
      // Clean refs from both ProductCreator and InvoiceGenerator
      if (cleanedTabState.fileInputRef) delete cleanedTabState.fileInputRef;
      if (cleanedTabState.formRef) delete cleanedTabState.formRef;
      cleaned[tabKey] = cleanedTabState;
    }
  });

  return cleaned;
};

const App = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Find active tab based on current path
  const activeTab =
    Object.keys(TAB_CONFIG).find(
      (key) => TAB_CONFIG[key].path === location.pathname
    ) || "inventory";

  // State for tab data persistence
  const [tabState, setTabState] = useState({
    inventory: {},
    invoice: {},
    create: {},
    analytics: {},
  });

  // Handle tab change
  const handleTabChange = (value) => {
    Logger.debug(`Tab changed to: ${value}`);
    navigate(TAB_CONFIG[value].path);
  };

  // Update tab state with memoized callback
  const updateTabState = useCallback((tab, data) => {
    setTabState((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], ...data },
    }));
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Save tab state to localStorage when it changes
  useEffect(() => {
    try {
      const cleanedState = cleanDataForStorage(tabState);
      localStorage.setItem("tabState", JSON.stringify(cleanedState));
    } catch (error) {
      Logger.error("Error saving tab state:", error);
    }
  }, [tabState]);

  // Load tab state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("tabState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Rehydrate any necessary refs when loading the state
        Object.keys(parsedState).forEach((tabKey) => {
          if (parsedState[tabKey]) {
            parsedState[tabKey].fileInputRef = React.createRef();
          }
        });
        setTabState(parsedState);
      }
    } catch (error) {
      Logger.error("Error loading tab state:", error);
    }
  }, []); // Empty dependency array for mount-only effect

  return (
    <div
      className={`relative max-w-xl mx-auto p-5 ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white"
      } shadow-md rounded-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <img src={skaiLogo} alt="SKAI Accessories" className="h-12 w-auto" />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <InventoryProvider>
        <div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(TAB_CONFIG).map(
              ([value, { icon: Icon, title }]) => (
                <button
                  key={value}
                  onClick={() => handleTabChange(value)}
                  className={`
                  flex justify-center items-center p-2 border rounded-md
                  transition-colors duration-200
                  ${
                    activeTab === value
                      ? isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
                  title={title}
                >
                  <Icon size={20} />
                </button>
              )
            )}
          </div>

          <Routes>
            {Object.entries(TAB_CONFIG).map(
              ([value, { component: Component, path }]) => (
                <Route
                  key={value}
                  path={path}
                  element={
                    <Component
                      isActive={activeTab === value}
                      savedState={tabState[value]}
                      onStateChange={(data) => updateTabState(value, data)}
                    />
                  }
                />
              )
            )}
            <Route path="/" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </div>
      </InventoryProvider>
    </div>
  );
};

export default App;
