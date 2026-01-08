'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Play, Eye, Heart, MessageCircle } from 'lucide-react'

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterScore, setFilterScore] = useState('70')

  const { data: reels, isLoading } = useQuery({
    queryKey: ['reels', 'library', filterScore],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `/api/reels?status=APPROVED&minScore=${filterScore}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) throw new Error('Failed to fetch reel library')
      return response.json()
    },
  })

  const filteredReels = reels?.filter((reel: any) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      reel.resort?.name?.toLowerCase().includes(searchLower) ||
      reel.resort?.instagramHandle?.toLowerCase().includes(searchLower)
    )
  }) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reel Library</h1>
          <p className="text-gray-600 mt-2">
            Browse and manage approved Instagram Reels
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by resort name or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="70">Score 70+</option>
              <option value="80">Score 80+</option>
              <option value="90">Score 90+</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReels.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reels found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReels.map((reel: any, index: number) => (
              <div
                key={reel.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.resort?.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                    {reel.viralScore}%
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white rounded text-xs">
                    {new Date(reel.postedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {reel.resort?.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    @{reel.resort?.instagramHandle}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{(reel.views || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{(reel.likes || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{(reel.comments || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-500">Engagement</p>
                      <p className="font-semibold text-gray-900">
                        {((reel.engagementRate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-500">View/Follow</p>
                      <p className="font-semibold text-gray-900">
                        {(reel.viewToFollowRatio || 0).toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
