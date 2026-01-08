'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import 'react-day-picker/dist/style.css'

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const { data: schedules } = useQuery({
    queryKey: ['schedule', 'calendar', currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `http://localhost:3001/api/schedule/calendar?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) throw new Error('Failed to fetch calendar data')
      return response.json()
    },
  })

  const getScheduledForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules?.filter((s: any) => s.date === dateStr) || []
  }

  const hasSchedule = (date: Date) => {
    const scheduled = getScheduledForDate(date)
    return scheduled.length > 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-2">
            View and manage your scheduled Instagram Reels
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <DayPicker
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasSchedule: (date) => hasSchedule(date),
                }}
                modifiersStyles={{
                  hasSchedule: {
                    backgroundColor: '#dbeafe',
                    fontWeight: 'bold',
                  },
                }}
                className="rdp"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>

              {getScheduledForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No reels scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getScheduledForDate(selectedDate).map((schedule: any) => (
                    <div
                      key={schedule.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      <img
                        src={schedule.reel.thumbnailUrl}
                        alt={schedule.reel.resort?.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {schedule.time}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            schedule.status === 'PUBLISHED' 
                              ? 'bg-green-100 text-green-800' 
                              : schedule.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {schedule.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          {schedule.reel.resort?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                            {schedule.reel.viralScore}%
                          </span>
                          <span className="text-xs text-gray-500">
                            Viral Score
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
