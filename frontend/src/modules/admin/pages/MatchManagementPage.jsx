import React, { useState } from 'react'
import AdminLayout from '../components/AdminLayout'

export default function MatchManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [exportToast, setExportToast] = useState('')

  // Seed Data: Simple Clean Matched User Pairs
  const pairings = [
    {
      id: 'MATCH-PAIR-101',
      matchScore: 96,
      date: '2026-02-05',
      user1: {
        id: 'PRF-502',
        name: 'Rohan Agrawal',
        gender: 'Male',
        age: 28,
        gotra: 'Garg',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        accountName: 'Rajesh Agrawal',
      },
      user2: {
        id: 'PRF-503',
        name: 'Anjali Bansal',
        gender: 'Female',
        age: 24,
        gotra: 'Bansal',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        accountName: 'Sunita Goyal',
      }
    },
    {
      id: 'MATCH-PAIR-102',
      matchScore: 94,
      date: '2026-02-06',
      user1: {
        id: 'PRF-504',
        name: 'Aarav Singhal',
        gender: 'Male',
        age: 29,
        gotra: 'Singhal',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        accountName: 'Vikram Singhal',
      },
      user2: {
        id: 'PRF-501',
        name: 'Priya Garg',
        gender: 'Female',
        age: 26,
        gotra: 'Garg',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
        accountName: 'Rajesh Agrawal',
      }
    },
    {
      id: 'MATCH-PAIR-103',
      matchScore: 91,
      date: '2026-02-07',
      user1: {
        id: 'PRF-506',
        name: 'Riya Goyal',
        gender: 'Female',
        age: 25,
        gotra: 'Goyal',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
        accountName: 'Pankaj Goyal',
      },
      user2: {
        id: 'PRF-504',
        name: 'Aarav Singhal',
        gender: 'Male',
        age: 29,
        gotra: 'Singhal',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        accountName: 'Vikram Singhal',
      }
    },
    {
      id: 'MATCH-PAIR-104',
      matchScore: 88,
      date: '2026-02-08',
      user1: {
        id: 'PRF-505',
        name: 'Neha Mittal',
        gender: 'Female',
        age: 27,
        gotra: 'Mittal',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
        accountName: 'Mahesh Mittal',
      },
      user2: {
        id: 'PRF-502',
        name: 'Rohan Agrawal',
        gender: 'Male',
        age: 28,
        gotra: 'Garg',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        accountName: 'Rajesh Agrawal',
      }
    }
  ]

  const filtered = pairings.filter(
    (p) =>
      p.user1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user1.gotra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user2.gotra.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Direct CSV Export Matches Report
  const handleExportMatchesReport = () => {
    const dataToExport = filtered.length > 0 ? filtered : pairings
    if (!dataToExport || dataToExport.length === 0) {
      alert('No match records available to export.')
      return
    }

    const dateStr = new Date().toISOString().split('T')[0]
    const headers = [
      'Match Pair ID',
      'Match Compatibility Score',
      'Matched Date',
      'Candidate 1 Profile ID',
      'Candidate 1 Name',
      'Candidate 1 Gender',
      'Candidate 1 Age',
      'Candidate 1 Gotra',
      'Candidate 1 Account Name',
      'Candidate 2 Profile ID',
      'Candidate 2 Name',
      'Candidate 2 Gender',
      'Candidate 2 Age',
      'Candidate 2 Gotra',
      'Candidate 2 Account Name'
    ]

    const escapeCsv = (field) => {
      if (field === null || field === undefined) return '""'
      const val = String(field).replace(/"/g, '""')
      return `"${val}"`
    }

    const rows = dataToExport.map((pair) => [
      escapeCsv(pair.id),
      escapeCsv(`${pair.matchScore}%`),
      escapeCsv(pair.date),
      escapeCsv(pair.user1.id),
      escapeCsv(pair.user1.name),
      escapeCsv(pair.user1.gender),
      escapeCsv(pair.user1.age),
      escapeCsv(pair.user1.gotra),
      escapeCsv(pair.user1.accountName),
      escapeCsv(pair.user2.id),
      escapeCsv(pair.user2.name),
      escapeCsv(pair.user2.gender),
      escapeCsv(pair.user2.age),
      escapeCsv(pair.user2.gotra),
      escapeCsv(pair.user2.accountName)
    ].join(','))

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Matched_Users_Report_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setExportToast(`Matches report downloaded successfully (${dataToExport.length} match pair records).`)
    setTimeout(() => {
      setExportToast('')
    }, 4000)
  }

  return (
    <AdminLayout title="Match Data">
      {/* Toast Notification Banner */}
      {exportToast && (
        <div className="mb-4 bg-emerald-900/90 text-emerald-100 border border-emerald-500/40 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span>{exportToast}</span>
          </div>
          <button
            onClick={() => setExportToast('')}
            className="text-emerald-300 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013]">
            Matched Users Data
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Simple record showing candidate profile match pairs and compatibility scores.
          </p>
        </div>

        {/* Controls: Search Bar + Export Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#775a19] text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate or gotra..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-amber-900/20 rounded-md text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 placeholder:text-stone-400"
            />
          </div>

          <button
            onClick={handleExportMatchesReport}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-emerald-50 font-bold rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs border border-emerald-600/40 transition-colors cursor-pointer shrink-0"
            title="Download Matched Users Report"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* SIMPLE MATCHED DATA TABLE */}
      <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#570013] text-amber-100 border-b border-amber-900/40 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4.5">Candidate 1</th>
                <th className="py-4 px-4.5 text-center">Compatibility</th>
                <th className="py-4 px-4.5">Candidate 2</th>
                <th className="py-4 px-4.5 text-right">Matched Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-[#775a19] font-semibold">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pair) => (
                  <tr key={pair.id} className="hover:bg-amber-50/60 transition-colors">
                    {/* Candidate 1 */}
                    <td className="py-4 px-4.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={pair.user1.image}
                          alt={pair.user1.name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-300 shadow-2xs shrink-0"
                        />
                        <div>
                          <p className="font-bold text-base text-[#570013]">{pair.user1.name}</p>
                          <p className="text-xs text-[#775a19] font-bold">
                            {pair.user1.gotra} Gotra • {pair.user1.age} yrs ({pair.user1.gender})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Compatibility Match Badge */}
                    <td className="py-4 px-4.5 text-center">
                      <span className="px-3 py-1 bg-amber-100/80 text-[#570013] border border-amber-300 font-extrabold rounded-md text-xs inline-flex items-center gap-1.5 shadow-2xs">
                        <span className="material-symbols-outlined text-sm">sync_alt</span>
                        <span>{pair.matchScore}% Match</span>
                      </span>
                    </td>

                    {/* Candidate 2 */}
                    <td className="py-4 px-4.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={pair.user2.image}
                          alt={pair.user2.name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-300 shadow-2xs shrink-0"
                        />
                        <div>
                          <p className="font-bold text-base text-[#570013]">{pair.user2.name}</p>
                          <p className="text-xs text-[#775a19] font-bold">
                            {pair.user2.gotra} Gotra • {pair.user2.age} yrs ({pair.user2.gender})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Matched Date */}
                    <td className="py-4 px-4.5 text-right font-mono text-xs text-stone-700 font-semibold">
                      {pair.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

