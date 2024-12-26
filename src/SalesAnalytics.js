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
import api from "./services/api";
import Logger from "./Logger";

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
      Logger.debug("Starting sales data fetch");
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      Logger.debug(`Fetching analytics from ${startDate} to ${endDate}`);

      // Fetch aggregated analytics data
      const analyticsData = await api.get("/analytics/aggregate", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          metrics: "sales,orders,categories,products,payments",
          groupBy: "day",
        },
      });

      // Transform API response to component state format
      const transformedData = transformAnalyticsData(analyticsData);
      setAnalytics(transformedData);

      Logger.info("Sales analytics data fetched successfully", {
        period: "30d",
        metrics: Object.keys(transformedData),
      });
    } catch (error) {
      const errorMessage = "Failed to fetch sales data";
      setError(errorMessage);
      Logger.error(`Error fetching sales analytics: ${error.message}`, {
        error,
        period: "30d",
      });
    } finally {
      setLoading(false);
    }
  };

  const transformAnalyticsData = (apiData) => {
    Logger.debug("Transforming analytics data", {
      dataPoints: Object.keys(apiData).length,
    });

    return {
      totalSales: apiData.totalSales || 0,
      totalOrders: apiData.totalOrders || 0,
      averageOrderValue:
        apiData.totalOrders > 0 ? apiData.totalSales / apiData.totalOrders : 0,
      dailySales:
        apiData.dailySales?.map((day) => ({
          date: new Date(day.date).toLocaleDateString(),
          amount: day.sales,
        })) || [],
      topProducts:
        apiData.topProducts?.map((product) => ({
          name: product.name,
          quantity: product.quantity,
        })) || [],
      paymentMethods:
        apiData.paymentMethods?.map((method) => ({
          name: method.name,
          value: method.count,
        })) || [],
      categoryDistribution:
        apiData.categoryDistribution?.map((category) => ({
          name: category.name,
          value: category.sales,
        })) || [],
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
