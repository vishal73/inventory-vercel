import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getInvoicesByDateRange } from "./database";
import Logger from "./Logger";

const logger = Logger;
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailySales: [],
    topProducts: [],
    paymentMethods: [],
    categoryDistribution: [],
  });

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      logger.debug("Starting sales data fetch");
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      logger.debug(`Fetching invoices from ${startDate} to ${endDate}`);
      const invoices = await getInvoicesByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      logger.debug(`Retrieved ${invoices.length} invoices`);
      const analyticsData = calculateAnalytics(invoices);
      setAnalytics(analyticsData);
      logger.info("Sales analytics data fetched successfully");
    } catch (error) {
      setError("Failed to fetch sales data");
      logger.error(`Error fetching sales analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (invoices) => {
    logger.debug("Starting analytics calculations");

    // Calculate total sales and orders
    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalOrders = invoices.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    logger.debug(
      `Calculated totals: Sales=${totalSales}, Orders=${totalOrders}, Avg=${averageOrderValue}`
    );

    // Calculate daily sales
    const dailySales = invoices.reduce((acc, inv) => {
      const date = new Date(inv.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + inv.totalAmount;
      return acc;
    }, {});

    // Calculate top products
    const productSales = invoices.reduce((acc, inv) => {
      inv.products.forEach((prod) => {
        acc[prod.name] = (acc[prod.name] || 0) + prod.quantity;
      });
      return acc;
    }, {});

    // Calculate payment method distribution
    const paymentMethods = invoices.reduce((acc, inv) => {
      acc[inv.paymentMethod] = (acc[inv.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    // Calculate category distribution
    const categoryDistribution = invoices.reduce((acc, inv) => {
      inv.products.forEach((prod) => {
        acc[prod.category] = (acc[prod.category] || 0) + prod.totalPrice;
      });
      return acc;
    }, {});

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      dailySales: Object.entries(dailySales).map(([date, amount]) => ({
        date,
        amount,
      })),
      topProducts: Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity })),
      paymentMethods: Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value,
      })),
      categoryDistribution: Object.entries(categoryDistribution).map(
        ([name, value]) => ({
          name,
          value,
        })
      ),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Sales Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{analytics.totalSales.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{analytics.averageOrderValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailySales}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution & Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.topProducts.map((product, index) => (
                <li
                  key={product.name}
                  className="flex justify-between items-center"
                >
                  <span>{product.name}</span>
                  <span className="font-bold">{product.quantity} units</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesAnalytics;
