'use client'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { ADMIN_EMAILS } from '@/lib/admins'

import AdminDashboard from './AdminDashboard'
import UserDashboard from './UserDashboard'

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.user.data);
  const isLoading = useSelector((state: RootState) => state.user.loading);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-valentine-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-valentine-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-valentine-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="mt-4 text-valentine-red text-lg">Loading your dashboard</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // This can be a login prompt or a redirect
    return <div className="text-center p-12">Please log in to view the dashboard.</div>
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

  return isAdmin 
    ? <AdminDashboard /> 
    : <UserDashboard />;
}