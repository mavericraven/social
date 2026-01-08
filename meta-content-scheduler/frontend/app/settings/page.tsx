'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Save, Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  
  const [accountId] = useState('default-account-id')
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', accountId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `http://localhost:3001/api/settings/${accountId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) throw new Error('Failed to fetch settings')
      return response.json()
    },
    enabled: !!accountId,
  })

  const [formData, setFormData] = useState({
    postingSchedule: ['12:00', '15:00', '18:00', '20:00', '22:00'],
    captionTemplate: '',
    dailyReelCount: 5,
    minReelGapMinutes: 90,
    viralScoreThreshold: 70,
  })

  const updateSettings = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:3001/api/settings/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update settings')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', accountId] })
      alert('Settings updated successfully!')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings.mutate(formData)
  }

  const handleTimeSlotToggle = (time: string) => {
    const newSchedule = formData.postingSchedule.includes(time)
      ? formData.postingSchedule.filter((t) => t !== time)
      : [...formData.postingSchedule, time].sort()

    setFormData({ ...formData, postingSchedule: newSchedule })
  }

  const availableTimeSlots = [
    '06:00', '08:00', '10:00', '12:00', '14:00', '16:00',
    '18:00', '20:00', '22:00', '23:00'
  ]

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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your Instagram Reels automation preferences
          </p>
        </div>

        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Posting Schedule
                </h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Reel Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.dailyReelCount}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dailyReelCount: parseInt(e.target.value) 
                  })}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of reels to post each day
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Slots
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSlotToggle(time)}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        formData.postingSchedule.includes(time)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formData.postingSchedule.length} time slots selected
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Content Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viral Score Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.viralScoreThreshold}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      viralScoreThreshold: parseInt(e.target.value) 
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum viral score (0-100)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Reel Gap (minutes)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="360"
                    value={formData.minReelGapMinutes}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      minReelGapMinutes: parseInt(e.target.value) 
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Time between consecutive posts
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption Template
                </label>
                <textarea
                  rows={4}
                  value={formData.captionTemplate}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    captionTemplate: e.target.value 
                  })}
                  placeholder="Use placeholders: {resort_name}, {credit}, {hashtags}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Customize your post captions
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="submit"
                disabled={updateSettings.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save className="w-5 h-5" />
                {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
