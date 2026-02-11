/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from 'react';
import DisplayCard from "../components/MatchDisplay";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from 'axios';
import Cookies from 'js-cookie';

export default function MatchPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Get token from cookies
        const token = Cookies.get('token');
        if (!token) {
          setError('Please log in to view your matches');
          setLoading(false);
          return;
        }

        console.log('[Match Page] Token found, fetching match data...');

        const response = await axios.get('/api/user/match');
        const data = response.data;

        console.log(`[Match Page] Match data received:`, data);
        
        if (data.success) {
          if (data.match) {
            setMatchData(data.match);
          } else {
            setError('No match found yet. Please check back later!');
          }
        } else {
          setError(data.message || 'Failed to load match data');
        }

      } catch (err: any) {
        console.error('[Match Page] Error fetching match:', err);
        
        if (err.response?.status === 404) {
          // User not found in form responses
          const errorData = err.response.data;
          if (errorData.userEmail) {
            setError(`You haven't submitted the form yet. Please submit the form first to get matched. (Your email: ${errorData.userEmail})`);
          } else {
            setError('You haven\'t submitted the form yet. Please submit the form first to get matched.');
          }
        } else if (err.response?.status === 401) {
          setError('Please log in to view your matches');
        } else {
          setError('Failed to load your match data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, []); 

  if (loading) {
    return (
      <main className="min-h-screen bg-valentine-light">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-valentine-red text-xl">Loading your match...</div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-valentine-light">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-valentine-red text-xl text-center max-w-md mx-auto px-4">
            <p className="mb-4">{error}</p>
            {error.includes("haven't submitted the form") && (
              <div className="mt-4">
                <a 
                  href="/survey" 
                  className="bg-valentine-red text-white px-6 py-3 rounded-lg hover:bg-valentine-pink transition-colors inline-block"
                >
                  Submit Form Now
                </a>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-valentine-light">
      <Navbar />
      {matchData && <DisplayCard matchData={matchData} />}
      <Footer />
    </main>
  );
}