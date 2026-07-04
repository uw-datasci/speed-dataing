'use client';

import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="mx-4 p-6 lg:p-12 bg-white rounded-t-4xl">
      <header>
        <h1 className="text-xl text-center font-semibold py-5 lg:text-6xl mt-1 text-[#374995] lg:pb-3">
          Welcome, Admin!
        </h1>
      </header>
      <main className="mt-4 lg:mt-8 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-[#374995] px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Admin Panel:</strong>
          <span className="block sm:inline"> You have access to administrative features.</span>
        </div>
        {/* add admin-specific components and features here */}
      </main>
    </div>
  );
} 