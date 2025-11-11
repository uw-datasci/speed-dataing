/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios, { AxiosError } from 'axios';
import { FaSync, FaHistory, FaUser, FaGraduationCap, FaCalendar, FaLink, FaHeart } from 'react-icons/fa';

interface Match {
  matchedUserId: string;
  name: string;
  social_media_links: string;
  program: string;
  year: string;
  similarity_score: number;
}

const HistoryPage = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user.data);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/user/history');
      
      if (response.data.matches) {
        setMatches(response.data.matches);
      } else {
        setMatches([]);
      }
    } catch (error: unknown) {
      console.error('[History Page] Error fetching history:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        router.push('/');
        return;
      }
      setError((axiosError.response?.data as { error?: string })?.error || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    
    fetchHistory();
  }, [user, router, fetchHistory]);

  const formatSimilarityScore = (score: number) => {
    return `${(score * 100).toFixed(1)}%`;
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-[#E6EFFD]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-[#374995]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaHistory className="text-2xl text-[#374995]" />
                <h1 className="text-3xl font-bold text-[#374995]">Your Match History</h1>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-[#374995] text-white px-4 py-2 rounded-lg hover:bg-[#5989fc] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              View all your previous matches from speed dataing here
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#374995]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center">
                  <FaSync className="animate-spin mr-2 text-[#374995]" />
                  Loading your match history...
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={fetchHistory}
                  className="bg-[#374995] text-white px-4 py-2 rounded-lg hover:bg-[#5989fc] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-8 text-center">
                <FaHeart className="text-4xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Previous Matches</h3>
                <p className="text-gray-500">
                  You haven&apos;t been matched with anyone yet. Come back later to see your matches!
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-[#374995]">
                    Previous Matches ({matches.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <FaUser />
                            Name
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <FaGraduationCap />
                            Program
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <FaCalendar />
                            Year
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <FaLink />
                            Social Media
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <FaHeart />
                            Compatibility
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matches.map((match) => (
                        <tr key={match.matchedUserId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {match.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {match.program}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {match.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {match.social_media_links ? (
                                <span className="text-[#374995] hover:underline cursor-pointer">
                                  {match.social_media_links}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Not provided</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <span className="font-medium text-[#374995]">
                                {formatSimilarityScore(match.similarity_score)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HistoryPage;
