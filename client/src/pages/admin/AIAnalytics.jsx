import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import AnalyticsService from '../../services/AnalyticsService';
import {
  TrendingUp, Droplets, MapPin, AlertTriangle,
  Download, Brain, Activity, Calendar, Sun, Moon,
  Users, Heart, CheckCircle, RefreshCw, Clock, BarChart3, PieChart,
  Gift, Wallet, Menu
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [statsRes, predRes] = await Promise.all([
        AnalyticsService.getStats(),
        AnalyticsService.getPredictions(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        prepareMonthlyChartData(statsRes.data);
      } else {
        console.error('Stats API failed:', statsRes);
        setError('Failed to load statistics data');
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1a1a2e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red mx-auto mb-4"></div>
          <p className="text-white/60 text-sm font-medium">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-[#0f172a] to-[#1a1a2e]' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full">
        {/* Mobile Header - Exactly matching AdminDashboard */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/10 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="bg-medical-red p-2.5 rounded-xl shadow-lg">
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {/* Welcome Header - Matching AdminDashboard style */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-medical-red/10 rounded-2xl">
                  <Brain size={28} className="text-medical-red" />
                </div>
                <div>
                  <h1 className={`text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-3 ${
                    isDarkMode ? 'text-white' : 'text-[#1B2559]'
                  }`}>
                    AI Analytics Dashboard
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    AI-Powered Insights & Predictions
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
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
                  onClick={handlePDFExport}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-green-700 transition-all"
                >
                  <Download size={14} /> PDF Report
                </button>
                <button onClick={toggleTheme} className={`p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons Row */}
          <div className="md:hidden flex flex-wrap gap-2 mb-6">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-black text-[10px] uppercase tracking-wider hover:bg-medical-red hover:text-white transition-all"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-medical-red text-white font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={handlePDFExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-green-700 transition-all"
            >
              <Download size={14} /> PDF
            </button>
          </div>

          {/* Last Updated - Matching AdminDashboard style */}
          {lastUpdated && (
            <div className="flex items-center gap-2 mb-6 text-[9px] font-black uppercase text-gray-400">
              <Clock size={12} />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
              <AlertTriangle size={16} className="inline mr-2" />
              {error}
            </div>
          )}

          {/* AI Predictions Card */}
          {predictions?.data && (
            <div className="mb-8 p-4 md:p-8 rounded-[30px] md:rounded-[40px] bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={24} className="md:size-28" />
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase italic">AI Demand Forecast</h2>
                  <p className="text-[8px] md:text-[10px] opacity-80">Powered by Groq AI • Llama 3</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                  <p className="text-[8px] md:text-[10px] font-black uppercase opacity-80">Predicted Shortage</p>
                  <p className="text-2xl md:text-4xl font-black mt-1">{predictions.data.shortageBloodType || 'O+'}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                  <p className="text-[8px] md:text-[10px] font-black uppercase opacity-80">Demand Increase</p>
                  <p className="text-2xl md:text-4xl font-black mt-1">+{predictions.data.demandIncrease || 0}%</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                  <p className="text-[8px] md:text-[10px] font-black uppercase opacity-80">AI Confidence</p>
                  <p className="text-2xl md:text-4xl font-black mt-1">{predictions.data.confidence || 0}%</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                  <p className="text-[8px] md:text-[10px] font-black uppercase opacity-80">Recommended Location</p>
                  <p className="text-sm md:text-sm font-black mt-1 flex items-center gap-1">
                    <MapPin size={14} /> {predictions.data.recommendedLocation || 'Addis Ababa'}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-[8px] md:text-[10px] font-black uppercase opacity-80 mb-2">AI Recommendation</p>
                <p className="text-xs md:text-sm font-medium italic">"{predictions.data.recommendation || 'Schedule regular donation drives'}"</p>
              </div>
            </div>
          )}

          {/* Stats Grid - Matching AdminDashboard stat card pattern */}
          {stats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <StatCard
                  icon={<Users size={20} />}
                  label="Active Donors"
                  value={stats.stats?.totalDonors || 0}
                  color="blue"
                  darkMode={isDarkMode}
                />
                <StatCard
                  icon={<Heart size={20} />}
                  label="Active Recipients"
                  value={stats.stats?.totalRecipients || 0}
                  color="red"
                  darkMode={isDarkMode}
                />
                <StatCard
                  icon={<Activity size={20} />}
                  label="Active Requests"
                  value={stats.stats?.activeRequests || 0}
                  color="yellow"
                  darkMode={isDarkMode}
                />
                <StatCard
                  icon={<CheckCircle size={20} />}
                  label="Completed Matches"
                  value={stats.stats?.completedMatches || 0}
                  color="green"
                  darkMode={isDarkMode}
                />
              </div>

              {/* Top Needs Row - Using same card styling as AdminDashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                      <Droplets size={20} />
                    </div>
                    <h3 className={`font-black text-xs md:text-sm uppercase ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Top Blood Need
                    </h3>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-medical-red">{stats.topNeeds?.blood || 'O+'}</p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Based on pending requests</p>
                </div>

                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                      <Heart size={20} />
                    </div>
                    <h3 className={`font-black text-xs md:text-sm uppercase ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Top Organ Need
                    </h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-pink-500 truncate">{stats.topNeeds?.organ || 'Kidney'}</p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Highest transplant demand</p>
                </div>

                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <Gift size={20} />
                    </div>
                    <h3 className={`font-black text-xs md:text-sm uppercase ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Top Supply Need
                    </h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-orange-500 truncate">{stats.topNeeds?.inKind || 'Medical Supplies'}</p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Most requested in-kind item</p>
                </div>

                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                      <Wallet size={20} />
                    </div>
                    <h3 className={`font-black text-xs md:text-sm uppercase ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Financial Queue
                    </h3>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-green-500">{stats.topNeeds?.financialPendingCount || 0}</p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Pending aid requests</p>
                </div>
              </div>

              {/* GRAPHS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                {/* Blood Type Distribution - Bar Chart */}
                <div className={`rounded-2xl p-5 md:p-6 shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <BarChart3 size={20} className="text-medical-red" />
                    <h3 className={`font-black text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Blood Type Distribution
                    </h3>
                  </div>
                  <div className="h-64 md:h-80">
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
                <div className={`rounded-2xl p-5 md:p-6 shadow-xl ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <PieChart size={20} className="text-medical-red" />
                    <h3 className={`font-black text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Donor Composition
                    </h3>
                  </div>
                  <div className="h-64 md:h-80">
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
              <div className={`rounded-2xl p-5 md:p-6 shadow-xl mb-6 md:mb-8 ${isDarkMode ? 'bg-[#111C44]' : 'bg-white'}`}>
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <Activity size={20} className="text-medical-red" />
                  <h3 className={`font-black text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                    6-Month Trends: Requests vs Donations
                  </h3>
                </div>
                <div className="h-64 md:h-80">
                  {getTrendChartData() ? (
                    <Line data={getTrendChartData()} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No trend data available
                    </div>
                  )}
                </div>
              </div>

              {/* Second Row Stats - Matching AdminDashboard card pattern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-medical-red/10 text-medical-red flex items-center justify-center">
                      <Calendar size={20} />
                    </div>
                    <h3 className={`font-black text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Upcoming Events
                    </h3>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-medical-red">{stats.stats?.upcomingEvents || 0}</p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Active donation drives</p>
                </div>

                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                      <AlertTriangle size={20} />
                    </div>
                    <h3 className={`font-black text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Alert Level
                    </h3>
                  </div>
                  <p className={`text-3xl md:text-4xl font-black ${
                    stats.alertLevel === 'High' ? 'text-red-500' :
                    stats.alertLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {stats.alertLevel || 'Low'}
                  </p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">
                    {stats.stats?.criticalRequests || 0} critical requests pending
                  </p>
                </div>

                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
                  isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Droplets size={20} />
                    </div>
                    <h3 className={`font-black text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      Most Needed Blood
                    </h3>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-medical-red">
                    {stats.bloodTypeDistribution?.[0]?.bloodType || stats.topNeeds?.blood || 'O+'}
                  </p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Based on current demand</p>
                </div>
              </div>

              {/* Alert Banner for High Demand */}
              {predictions?.data?.demandIncrease > 20 && (
                <div className="p-4 md:p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 animate-pulse">
                  <AlertTriangle className="text-red-500" size={24} />
                  <div>
                    <p className="font-black text-red-500 uppercase text-xs md:text-sm">Urgent: Blood Shortage Alert</p>
                    <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs mt-1">
                      {predictions.data.shortageBloodType} blood type is predicted to be in short supply.
                      Consider scheduling additional donation drives.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Stat Card Component - Exactly matching AdminDashboard style
const StatCard = ({ icon, label, value, color, darkMode }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    red: 'bg-red-500/10 text-red-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
    gray: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-500 shadow-lg hover:shadow-xl ${
      darkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
    }`}>
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className={`text-2xl md:text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-[#1B2559]'}`}>
        {value}
      </p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
};

export default AIAnalytics;