import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import AnalyticsService from '../../services/AnalyticsService';
import {
  TrendingUp, Droplets, MapPin, AlertTriangle,
  Download, Brain, Activity, Calendar, Sun, Moon,
  Users, Heart, CheckCircle, RefreshCw, Clock, BarChart3, PieChart,
  Gift, Wallet
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const AIAnalytics = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [statsRes, predRes] = await Promise.all([
        AnalyticsService.getStats(),
        AnalyticsService.getPredictions(),
      ]);

      console.log('Stats Response:', statsRes); // Debug log
      console.log('Predictions Response:', predRes); // Debug log

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        prepareMonthlyChartData(statsRes.data);
      } else {
        console.error('Stats API failed:', statsRes);
        setError('Failed to load statistics data');
        // Set default stats to prevent empty dashboard
        setStats({
          stats: {
            totalDonors: 0,
            totalRecipients: 0,
            activeRequests: 0,
            completedMatches: 0,
            upcomingEvents: 0,
            criticalRequests: 0,
          },
          alertLevel: 'Low',
          bloodTypeDistribution: [],
          topNeeds: {
            blood: 'O+',
            organ: 'Kidney',
            inKind: 'Medical Supplies',
            financialPendingCount: 0,
          },
        });
      }

      if (predRes.success && predRes.data) {
        setPredictions(predRes);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const prepareMonthlyChartData = (data) => {
    // Mock monthly trends (replace with real data when available)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    setMonthlyData({
      requests: [65, 72, 88, 95, 110, 125],
      donations: [58, 64, 75, 82, 98, 112],
      months: months,
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    await fetchData();
  };

  const handlePDFExport = async () => {
  await AnalyticsService.exportPDFReport();
};

  const handleExport = async () => {
    await AnalyticsService.exportReport();
  };

  // Chart configurations
  const getBarChartData = () => {
    if (!stats?.bloodTypeDistribution || stats.bloodTypeDistribution.length === 0) return null;

    return {
      labels: stats.bloodTypeDistribution.map(b => b.bloodType),
      datasets: [
        {
          label: 'Registered Donors',
          data: stats.bloodTypeDistribution.map(b => b._count),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  };

  const getTrendChartData = () => {
    if (!monthlyData) return null;

    return {
      labels: monthlyData.months,
      datasets: [
        {
          label: 'Donation Requests',
          data: monthlyData.requests,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
        },
        {
          label: 'Completed Donations',
          data: monthlyData.donations,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
        },
      ],
    };
  };

  const getPieChartData = () => {
    if (!stats?.bloodTypeDistribution || stats.bloodTypeDistribution.length === 0) return null;

    return {
      labels: stats.bloodTypeDistribution.map(b => b.bloodType),
      datasets: [
        {
          data: stats.bloodTypeDistribution.map(b => b._count),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(249, 115, 22, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#fff' : '#333',
          font: { size: 10, weight: 'bold' },
        },
      },
    },
    scales: {
      y: {
        ticks: { color: isDarkMode ? '#ccc' : '#666', font: { size: 10 } },
        grid: { color: isDarkMode ? '#333' : '#eee' },
      },
      x: {
        ticks: { color: isDarkMode ? '#ccc' : '#666', font: { size: 10 } },
        grid: { color: isDarkMode ? '#333' : '#eee' },
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 overflow-y-auto h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-medical-red/10 rounded-2xl">
              <Brain size={28} className="text-medical-red" />
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                AI Analytics Dashboard
              </h1>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mt-1">
                AI-Powered Insights & Predictions
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-black text-[10px] uppercase tracking-wider hover:bg-medical-red hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-medical-red text-white font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg"
            >
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>

            <button
  onClick={handlePDFExport}
  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-green-700 transition-all"
>
  <Download size={14} /> PDF Report
</button>

          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
            <AlertTriangle size={16} className="inline mr-2" />
            {error}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center gap-2 mb-6 text-[9px] font-black uppercase text-gray-400">
            <Clock size={12} />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* AI Predictions Card */}
        {predictions?.data && (
          <div className="mb-8 p-8 rounded-[40px] bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={28} />
              <div>
                <h2 className="text-2xl font-black uppercase italic">AI Demand Forecast</h2>
                <p className="text-[10px] opacity-80">Powered by Groq AI • Llama 3</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase opacity-80">Predicted Shortage</p>
                <p className="text-4xl font-black mt-1">{predictions.data.shortageBloodType || 'O+'}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase opacity-80">Demand Increase</p>
                <p className="text-4xl font-black mt-1">+{predictions.data.demandIncrease || 0}%</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase opacity-80">AI Confidence</p>
                <p className="text-4xl font-black mt-1">{predictions.data.confidence || 0}%</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase opacity-80">Recommended Location</p>
                <p className="text-sm font-black mt-1 flex items-center gap-1">
                  <MapPin size={14} /> {predictions.data.recommendedLocation || 'Addis Ababa'}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-[10px] font-black uppercase opacity-80 mb-2">AI Recommendation</p>
              <p className="text-sm font-medium italic">"{predictions.data.recommendation || 'Schedule regular donation drives'}"</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Users />}
                label="Active Donors"
                value={stats.stats?.totalDonors || 0}
                color="bg-blue-500"
                darkMode={isDarkMode}
              />
              <StatCard
                icon={<Heart />}
                label="Active Recipients"
                value={stats.stats?.totalRecipients || 0}
                color="bg-green-500"
                darkMode={isDarkMode}
              />
              <StatCard
                icon={<Activity />}
                label="Active Requests"
                value={stats.stats?.activeRequests || 0}
                color="bg-yellow-500"
                darkMode={isDarkMode}
              />
              <StatCard
                icon={<CheckCircle />}
                label="Completed Matches"
                value={stats.stats?.completedMatches || 0}
                color="bg-purple-500"
                darkMode={isDarkMode}
              />
            </div>

            {/* Unified Top Needs Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Droplets size={24} className="text-medical-red" />
                  <h3 className="font-black dark:text-white text-sm uppercase">Top Blood Need</h3>
                </div>
                <p className="text-4xl font-black text-medical-red">{stats.topNeeds?.blood || 'O+'}</p>
                <p className="text-gray-400 text-xs mt-2">Based on pending requests</p>
              </div>

              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Heart size={24} className="text-pink-500" />
                  <h3 className="font-black dark:text-white text-sm uppercase">Top Organ Need</h3>
                </div>
                <p className="text-3xl font-black text-pink-500 truncate">{stats.topNeeds?.organ || 'Kidney'}</p>
                <p className="text-gray-400 text-xs mt-2">Highest transplant demand</p>
              </div>

              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Gift size={24} className="text-orange-500" />
                  <h3 className="font-black dark:text-white text-sm uppercase">Top Supply Need</h3>
                </div>
                <p className="text-3xl font-black text-orange-500 truncate">{stats.topNeeds?.inKind || 'Medical Supplies'}</p>
                <p className="text-gray-400 text-xs mt-2">Most requested in-kind item</p>
              </div>

              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Wallet size={24} className="text-green-500" />
                  <h3 className="font-black dark:text-white text-sm uppercase">Financial Queue</h3>
                </div>
                <p className="text-4xl font-black text-green-500">{stats.topNeeds?.financialPendingCount || 0}</p>
                <p className="text-gray-400 text-xs mt-2">Pending aid requests</p>
              </div>
            </div>

            {/* GRAPHS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Blood Type Distribution - Bar Chart */}
              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={20} className="text-medical-red" />
                  <h3 className="font-black text-lg dark:text-white">Blood Type Distribution</h3>
                </div>
                <div className="h-64">
                  {getBarChartData() ? (
                    <Bar data={getBarChartData()} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No blood type data available
                    </div>
                  )}
                </div>
              </div>

              {/* Blood Type - Pie Chart */}
              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <PieChart size={20} className="text-medical-red" />
                  <h3 className="font-black text-lg dark:text-white">Donor Composition</h3>
                </div>
                <div className="h-64">
                  {getPieChartData() ? (
                    <Pie data={getPieChartData()} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No donor data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trends Line Chart */}
            <div className={`p-6 rounded-[35px] shadow-xl mb-8 ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-6">
                <Activity size={20} className="text-medical-red" />
                <h3 className="font-black text-lg dark:text-white">6-Month Trends: Requests vs Donations</h3>
              </div>
              <div className="h-80">
                {getTrendChartData() ? (
                  <Line data={getTrendChartData()} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No trend data available
                  </div>
                )}
              </div>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={24} className="text-medical-red" />
                  <h3 className="font-black dark:text-white">Upcoming Events</h3>
                </div>
                <p className="text-4xl font-black text-medical-red">{stats.stats?.upcomingEvents || 0}</p>
                <p className="text-gray-400 text-xs mt-2">Active donation drives</p>
              </div>

              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle size={24} className="text-medical-red" />
                  <h3 className="font-black dark:text-white">Alert Level</h3>
                </div>
                <p className={`text-4xl font-black ${
                  stats.alertLevel === 'High' ? 'text-red-500' :
                  stats.alertLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {stats.alertLevel || 'Low'}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {stats.stats?.criticalRequests || 0} critical requests pending
                </p>
              </div>

              <div className={`p-6 rounded-[35px] shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Droplets size={24} className="text-medical-red" />
                  <h3 className="font-black dark:text-white">Most Needed Blood</h3>
                </div>
                <p className="text-4xl font-black text-medical-red">
                  {stats.bloodTypeDistribution?.[0]?.bloodType || stats.topNeeds?.blood || 'O+'}
                </p>
                <p className="text-gray-400 text-xs mt-2">Based on current demand</p>
              </div>
            </div>

            {/* Alert Banner for High Demand */}
            {predictions?.data?.demandIncrease > 20 && (
              <div className="p-6 rounded-[30px] bg-red-500/10 border border-red-500/20 flex items-center gap-4 animate-pulse">
                <AlertTriangle className="text-red-500" size={28} />
                <div>
                  <p className="font-black text-red-500 uppercase text-sm">Urgent: Blood Shortage Alert</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                    {predictions.data.shortageBloodType} blood type is predicted to be in short supply.
                    Consider scheduling additional donation drives.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, darkMode }) => (
  <div className={`p-6 rounded-[35px] shadow-xl ${darkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
    <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase text-gray-400">{label}</p>
    <p className="text-3xl font-black dark:text-white mt-1">{value}</p>
  </div>
);

export default AIAnalytics;