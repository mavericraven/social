'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Video, AlertCircle, PlayCircle } from 'lucide-react'

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:3001/api/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your Instagram Reels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Reels</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {overview?.totalReels || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {overview?.totalPublished || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {(overview?.totalViews || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PlayCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Viral Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {overview?.averageViralScore || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {overview?.todaySchedules?.map((schedule: any, index: number) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={schedule.reel.thumbnailUrl}
                    alt={schedule.reel.resort?.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium">
                    {schedule.status}
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                    {schedule.reel.viralScore}%
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(schedule.scheduledFor).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {schedule.reel.resort?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    @{schedule.reel.resort?.instagramHandle}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {(!overview?.todaySchedules || overview.todaySchedules.length === 0) && (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reels scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
