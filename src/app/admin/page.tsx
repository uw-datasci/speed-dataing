/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../../../public/images/logo.svg";
import Image from "next/image";
import axios from "axios";
import {
  FaUsers,
  FaClipboardList,
  FaChartLine,
  FaCalendarAlt,
  FaSearch,
  FaSync,
  FaEye,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

interface Stats {
  totalResponses: number;
  uniqueUsers: number;
  weeklyResponses: number;
  dailyStats: Array<{ date: string; count: number }>;
  recentResponses: Array<any>;
  lastUpdated: string;
}

interface FormResponse {
  id: string;
  uuid: string;
  created_at: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminPage = () => {
  const router = useRouter();
  const name = useSelector((state: RootState) => state.user.data?.name);
  const [stats, setStats] = useState<Stats | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [settings, setSettings] = useState<any[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [runningMatching, setRunningMatching] = useState(false);

  // Access control is enforced server-side by src/app/admin/layout.tsx
  // (requireAdmin: exec or admin role on the shared uwdatascience.ca session).
  useEffect(() => {
    fetchStats();
    fetchResponses(1, "", "created_at", "desc");
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get("/api/admin/stats");
      setStats(response.data);
    } catch (error) {
      console.error("[Admin Page] Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchResponses = async (
    page = 1,
    search = searchTerm,
    sort = sortBy,
    order = sortOrder
  ) => {
    setLoadingResponses(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        sortBy: sort,
        sortOrder: order,
      });

      console.log("[Admin Page] Fetching responses with params:", {
        page,
        search,
        sort,
        order,
      });
      const response = await axios.get(`/api/admin/responses?${params}`);
      console.log("[Admin Page] Responses API response:", {
        responsesCount: response.data.responses?.length,
        pagination: response.data.pagination,
        sampleResponse: response.data.responses?.[0],
      });
      setResponses(response.data.responses);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("[Admin Page] Error fetching responses:", error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await axios.get("/api/admin/settings");

      if (response.data.success) {
        // Convert single setting to array format for compatibility
        setSettings([response.data.setting]);
        console.log("[Admin Page] Settings fetched:", response.data.setting);
      }
    } catch (error) {
      console.error("[Admin Page] Error fetching settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const toggleSetting = async (action: string) => {
    try {
      console.log("[Admin Page] Executing action:", action);

      const response = await axios.put("/api/admin/settings", { action });

      if (response.data.success) {
        // refresh settings from the database to get the latest state
        await fetchSettings();
        console.log(
          "[Admin Page] Action executed successfully:",
          response.data
        );
      }
    } catch (error) {
      console.error("[Admin Page] Error executing action:", error);
    }
  };

  const runMatchingAlgorithm = async () => {
    try {
      setRunningMatching(true);
      console.log("[Admin Page] Starting matching algorithm...");

      const response = await axios.post("/api/admin/run-matching");

      if (response.data.success) {
        console.log(
          "[Admin Page] Matching completed successfully:",
          response.data
        );
        alert(
          `Matching completed! Generated ${response.data.matchCount} matches.`
        );
      } else {
        console.log(
          "[Admin Page] Matching completed with message:",
          response.data.message
        );
        alert(response.data.message || "Matching completed");
      }
    } catch (error: any) {
      console.error("[Admin Page] Error running matching algorithm:", error);
      alert(
        `Error running matching algorithm: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setRunningMatching(false);
    }
  };

  const getSessionState = (): string => {
    const setting = settings.find((s) => s.key === "session_state");
    return setting ? setting.value : "idle";
  };

  const getSessionStateInfo = () => {
    const state = getSessionState();
    switch (state) {
      case "idle":
        return {
          title: "Session Inactive",
          description: "No form, no matching, no matches visible",
          color: "gray",
          nextAction: "start_form",
          nextActionText: "Start Form",
        };
      case "form_active":
        return {
          title: "Form Active",
          description: "Users can submit form responses",
          color: "green",
          nextAction: "start_matching",
          nextActionText: "Start Matching",
        };
      case "matching_in_progress":
        return {
          title: "Matching in Progress",
          description: "Form locked, algorithm running",
          color: "yellow",
          nextAction: "release_matches",
          nextActionText: "Release Matches",
        };
      case "matches_released":
        return {
          title: "Matches Released",
          description: "Users can view their matches",
          color: "blue",
          nextAction: "reset",
          nextActionText: "Reset Session",
        };
      default:
        return {
          title: "Unknown State",
          description: "Session state is unclear",
          color: "red",
          nextAction: "reset",
          nextActionText: "Reset Session",
        };
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchResponses(1, searchTerm, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortOrder(newOrder);
    fetchResponses(currentPage, searchTerm, field, newOrder);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchResponses(page, searchTerm, sortBy, sortOrder);
  };

  const handleAdminLogout = () => {
    router.push("/dashboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="text-blue-500" />
    ) : (
      <FaSortDown className="text-blue-500" />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E6EFFD]">
      <Navbar />
      <Image
        src={Logo}
        alt="Logo"
        className="w-3/5 lg:w-2/5 h-auto mx-auto py-8"
      />

      <main className="flex-1 p-6 lg:p-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl lg:text-5xl font-bold text-[#374995] mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-lg text-gray-600">
                  Welcome,{" "}
                  <span className="font-semibold text-[#374995]">{name}</span>!
                  Monitor your application data in real-time.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchStats}
                  disabled={loadingStats}
                  className="bg-[#374995] text-white px-4 py-2 rounded-lg hover:bg-[#5989fc] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FaSync className={loadingStats ? "animate-spin" : ""} />
                  refresh
                </button>

                <button
                  onClick={handleAdminLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Exit Admin
                </button>
              </div>
            </div>

            {/* Last Updated */}
            {stats?.lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {formatDate(stats.lastUpdated)}
              </p>
            )}
          </header>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-[#374995] text-[#374995]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("responses")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "responses"
                      ? "border-[#374995] text-[#374995]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Form Responses
                </button>
              </nav>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#374995]">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <FaClipboardList className="text-[#374995] text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Responses
                      </p>
                      <p className="text-2xl font-bold text-[#374995]">
                        {loadingStats ? "..." : stats?.totalResponses || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#374995]">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <FaUsers className="text-[#374995] text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Unique Users
                      </p>
                      <p className="text-2xl font-bold text-[#374995]">
                        {loadingStats ? "..." : stats?.uniqueUsers || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#374995]">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <FaChartLine className="text-[#374995] text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        This Week
                      </p>
                      <p className="text-2xl font-bold text-[#374995]">
                        {loadingStats ? "..." : stats?.weeklyResponses || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#374995]">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <FaCalendarAlt className="text-[#374995] text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Today</p>
                      <p className="text-2xl font-bold text-[#374995]">
                        {loadingStats
                          ? "..."
                          : stats?.dailyStats?.[stats.dailyStats.length - 1]
                              ?.count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Controls */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#374995]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-[#374995]">
                    Session Controls
                  </h3>
                  <button
                    onClick={fetchSettings}
                    disabled={loadingSettings}
                    className="bg-[#374995] text-white px-3 py-1 rounded text-sm hover:bg-[#5989fc] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaSync className={loadingSettings ? "animate-spin" : ""} />
                    refresh
                  </button>
                </div>

                {/* Current State Display */}
                <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Current State: {getSessionStateInfo().title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {getSessionStateInfo().description}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full bg-${
                        getSessionStateInfo().color
                      }-500`}
                    ></div>
                  </div>
                </div>

                {/* Next Action Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() =>
                      toggleSetting(getSessionStateInfo().nextAction)
                    }
                    disabled={loadingSettings}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      loadingSettings
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-[#374995] hover:bg-[#5989fc] text-white cursor-pointer"
                    } disabled:opacity-50`}
                  >
                    {loadingSettings
                      ? "Processing..."
                      : getSessionStateInfo().nextActionText}
                  </button>
                </div>

                {/* Matching Algorithm Button - Only show when matching_in_progress */}
                {getSessionState() === "matching_in_progress" && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={runMatchingAlgorithm}
                      disabled={runningMatching}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        runningMatching
                          ? "bg-yellow-400 text-yellow-600 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                      } disabled:opacity-50 flex items-center gap-2`}
                    >
                      {runningMatching ? (
                        <>
                          <FaSync className="animate-spin" />
                          Running Algorithm...
                        </>
                      ) : (
                        <>
                          <FaSync />
                          Run Matching Algorithm
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* State Flow Indicator */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Session Flow:
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <div
                      className={`px-3 py-1 rounded ${
                        getSessionState() === "idle"
                          ? "bg-gray-200"
                          : "bg-gray-100"
                      }`}
                    >
                      Idle
                    </div>
                    <div className="text-gray-400">→</div>
                    <div
                      className={`px-3 py-1 rounded ${
                        getSessionState() === "form_active"
                          ? "bg-green-200"
                          : "bg-gray-100"
                      }`}
                    >
                      Form Active
                    </div>
                    <div className="text-gray-400">→</div>
                    <div
                      className={`px-3 py-1 rounded ${
                        getSessionState() === "matching_in_progress"
                          ? "bg-yellow-200"
                          : "bg-gray-100"
                      }`}
                    >
                      Matching
                    </div>
                    <div className="text-gray-400">→</div>
                    <div
                      className={`px-3 py-1 rounded ${
                        getSessionState() === "matches_released"
                          ? "bg-blue-200"
                          : "bg-gray-100"
                      }`}
                    >
                      Released
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Responses Tab */}
          {activeTab === "responses" && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#374995]">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search responses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border-2 border-[#374995] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374995] focus:ring-opacity-50"
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="bg-[#374995] text-white px-6 py-2 rounded-lg hover:bg-[#5989fc] transition-colors flex items-center gap-2"
                  >
                    <FaSearch />
                    Search
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      fetchResponses(1, "", sortBy, sortOrder);
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Responses Table */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-[#374995]">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-[#374995]">
                    Form Responses ({pagination?.totalCount || 0})
                  </h3>
                </div>

                {loadingResponses ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center">
                      <FaSync className="animate-spin mr-2" />
                      Loading responses...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("id")}
                            >
                              <div className="flex items-center gap-2">
                                ID
                                {getSortIcon("id")}
                              </div>
                            </th>
                            <th
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("name")}
                            >
                              <div className="flex items-center gap-2">
                                Name
                                {getSortIcon("name")}
                              </div>
                            </th>
                            <th
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("email")}
                            >
                              <div className="flex items-center gap-2">
                                Email
                                {getSortIcon("email")}
                              </div>
                            </th>
                            <th
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("program")}
                            >
                              <div className="flex items-center gap-2">
                                Program
                                {getSortIcon("program")}
                              </div>
                            </th>
                            <th
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort("year")}
                            >
                              <div className="flex items-center gap-2">
                                Year
                                {getSortIcon("year")}
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {responses.map((response, index) => (
                            <tr
                              key={response.id || index}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.id || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.name || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.email || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.program || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.year || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  className="text-[#374995] hover:text-[#5989fc] mr-3"
                                  onClick={() => {
                                    console.log(
                                      "View response details:",
                                      response
                                    );
                                    // You can add a modal or expandable row here
                                  }}
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    console.log(
                                      "Delete response:",
                                      response.id
                                    );
                                    // Add delete functionality here
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700">
                            Showing{" "}
                            {(pagination.currentPage - 1) * pagination.limit +
                              1}{" "}
                            to{" "}
                            {Math.min(
                              pagination.currentPage * pagination.limit,
                              pagination.totalCount
                            )}{" "}
                            of {pagination.totalCount} results
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handlePageChange(pagination.currentPage - 1)
                              }
                              disabled={!pagination.hasPrev}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1 text-sm">
                              Page {pagination.currentPage} of{" "}
                              {pagination.totalPages}
                            </span>
                            <button
                              onClick={() =>
                                handlePageChange(pagination.currentPage + 1)
                              }
                              disabled={!pagination.hasNext}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
