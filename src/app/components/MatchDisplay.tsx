'use client';

import { useState } from 'react';

type MatchData = {
  emoji: string;
  similarity_score: number;
  matched_person: {
    name: string;
    email: string;
    pronouns: string;
    program: string;
    year: string;
    social_media_links: string;
  };
};

interface DisplayCardProps {
  matchData: MatchData;
}

export default function DisplayCard({ matchData }: DisplayCardProps) {
  const [showMatch, setShowMatch] = useState(false);

  const { emoji, similarity_score, matched_person } = matchData;
  const similarityPercentage = Math.round(similarity_score * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <p className="text-[#222949] text-lg py-6 mx-10 text-center">
        You&apos;ve got a match! Find your pair with the same emoji :)
      </p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-[15rem] leading-none mb-20 text-white">
            {emoji}
          </div>
          <h2 className="font-bold text-4xl text-[#222949] mb-2">
            {matched_person.name}
          </h2>
          <p className="text-[#222949] text-lg mb-4">
            {matched_person.pronouns} • {matched_person.program} {matched_person.year}
          </p>
          <p className="text-[#222949] text-sm mb-8">
            Match Score: {similarityPercentage}%
          </p>
          <button 
            onClick={() => setShowMatch(!showMatch)}
            className="mt-8 text-white/60 hover:text-white transition-colors"
            aria-label="Show match details"
          >
            <svg 
              className={`w-8 h-8 transform transition-transform duration-300 ${showMatch ? 'rotate-180' : ''} animate-bounce-subtle`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showMatch ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-[#314077] rounded-lg p-6 mx-4 text-left">
              <h3 className="text-white text-xl font-semibold mb-4">Your Match Details</h3>
              
              {/* Basic Info */}
              <div className="mb-6">
                <h4 className="text-white/90 font-medium mb-2">Basic Info</h4>
                <p className="text-white/80 mb-1">Name: {matched_person.name}</p>
                <p className="text-white/80 mb-1">Pronouns: {matched_person.pronouns}</p>
                <p className="text-white/80 mb-1">Program: {matched_person.program}</p>
                <p className="text-white/80 mb-1">Year: {matched_person.year}</p>
                {matched_person.social_media_links && (
                  <p className="text-white/80 mb-1">Socials: {matched_person.social_media_links}</p>
                )}
              </div>
         
              {/* Match Score */}
              <div className="border-t border-white/20 pt-4">
                <p className="text-white/90 font-medium">Match Compatibility: {similarityPercentage}%</p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${similarityPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}