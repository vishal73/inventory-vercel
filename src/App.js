import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Camera,
  List,
  FileText,
  PlusCircle,
  BarChart2,
  Sun,
  Moon,
} from "lucide-react";
import { InventoryProvider } from "./InventoryContext";
// import ProductScanner from "./ProductScanner";
import ProductList from "./ProductList";
import InvoiceGenerator from "./InvoiceGenerator";
import ProductCreator from "./ProductCreator";
import SalesAnalytics from "./SalesAnalytics";
import { useTheme } from "./ThemeContext";
import Logger from "./Logger";
import { skaiLogo } from "./assets/skaiLogo";

const logger = Logger;

const App = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("invoice");

  useEffect(() => {
    logger.debug(`Theme mode changed: ${isDarkMode ? "dark" : "light"}`);
  }, [isDarkMode]);

  const handleTabChange = (value) => {
    logger.debug(`Tab changed to: ${value}`);
    setActiveTab(value);
  };

  return (
    <InventoryProvider>
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
        <Tabs defaultValue="inventory" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 gap-2 mb-4">
            {[
              // { value: "scan", icon: Camera },
              { value: "inventory", icon: List },
              { value: "invoice", icon: FileText },
              { value: "create", icon: PlusCircle },
              { value: "analytics", icon: BarChart2 },
            ].map(({ value, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={({ selected }) =>
                  `flex justify-center items-center p-2 border rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                    selected ? (isDarkMode ? "bg-gray-700" : "bg-gray-300") : ""
                  }`
                }
              >
                <Icon size={20} />
              </TabsTrigger>
            ))}
          </TabsList>
          {/* <TabsContent value="scan">
            <ProductScanner />
          </TabsContent> */}
          <TabsContent value="inventory">
            <ProductList />
          </TabsContent>
          <TabsContent value="invoice">
            <InvoiceGenerator isActive={activeTab === "invoice"} />
          </TabsContent>
          <TabsContent value="create">
            <ProductCreator />
          </TabsContent>
          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </InventoryProvider>
  );
};

export default App;
