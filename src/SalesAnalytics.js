import React, { useContext, useMemo } from "react";
import { useInventory } from "./InventoryContext";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SalesAnalytics = () => {
  const { salesHistory } = useInventory();

  const analytics = useMemo(() => {
    const totalSales = salesHistory.reduce(
      (total, invoice) => total + invoice.total,
      0
    );
    const transactionCount = salesHistory.length;
    const averageSale =
      transactionCount > 0 ? totalSales / transactionCount : 0;

    // Calculate sales by day
    const salesByDay = salesHistory.reduce((acc, invoice) => {
      const date = new Date(invoice.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + invoice.total;
      return acc;
    }, {});

    // Find top selling products
    const productSales = salesHistory
      .flatMap((invoice) => invoice.items)
      .reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
      }, {});
    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalSales,
      transactionCount,
      averageSale,
      salesByDay,
      topProducts,
    };
  }, [salesHistory]);

  const chartData = Object.entries(analytics.salesByDay).map(
    ([date, total]) => ({
      date,
      total,
    })
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              Rs. {analytics.totalSales.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{analytics.transactionCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              Rs. {analytics.averageSale.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {analytics.topProducts.map(([product, quantity]) => (
              <li key={product}>
                {product}: {quantity} units
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
