import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function DashboardScreen({ initialTab, onSelectProfile, onBack, isPremiumUser }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState(initialTab || 'Home') // 'Home' | 'Matches' | 'Search' | 'Interests' | 'Messages' | 'Notifications' | 'Profile'
  const [matchesCategory, setMatchesCategory] = useState('Recommended')
  const [interestsTab, setInterestsTab] = useState('Received')
  const [chatsTab, setChatsTab] = useState('Chats') // 'Chats' | 'Calls'
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [newMessageText, setNewMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [favorites, setFavorites] = useState({})
  const [interested, setInterested] = useState({})

  const [notificationsTab, setNotificationsTab] = useState('All')

  useEffect(() => {
    const path = location.pathname
    if (path === '/matches') setActiveTab('Matches')
    else if (path === '/search') setActiveTab('Search')
    else if (path === '/interests') setActiveTab('Interests')
    else if (path === '/chat' || path === '/messages') setActiveTab('Messages')
    else if (path === '/profile') setActiveTab('Profile')
    else if (path === '/notifications') setActiveTab('Notifications')
    else if (path === '/home' || path === '/dashboard') setActiveTab('Home')
    else if (initialTab) setActiveTab(initialTab)
  }, [location.pathname, initialTab])

  const handleTabNavigate = (tabId) => {
    if (tabId === 'Home') navigate('/home')
    else if (tabId === 'Matches') navigate('/matches')
    else if (tabId === 'Search') navigate('/search')
    else if (tabId === 'Interests') navigate('/interests')
    else if (tabId === 'Messages') {
      setSelectedChat(null)
      navigate('/chat')
    } else if (tabId === 'Profile') {
      navigate('/profile')
    } else if (tabId === 'Notifications') {
      navigate('/notifications')
    } else if (tabId === 'Membership') {
      navigate('/membership')
    }
  }

  // Chats list data
  const [chatsList, setChatsList] = useState([
    {
      id: 'c1',
      name: 'Priya Sharma',
      lastMessage: 'Typing...',
      isTyping: true,
      time: '11:30 AM',
      unreadCount: 2,
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c2',
      name: 'Anjali Verma',
      lastMessage: 'Hello 👋',
      time: '10:15 AM',
      unreadCount: 1,
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c3',
      name: 'Riya Singh',
      lastMessage: 'Sent a photo',
      time: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c4',
      name: 'Kavya Agarwal',
      lastMessage: 'Thank you 😊',
      time: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c5',
      name: 'Neha Jain',
      lastMessage: 'Hi, How are you?',
      time: '2 May',
      unreadCount: 0,
      isOnline: false,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    },
  ])

  const initialConversation = {
    c1: [
      { id: 'm1', sender: 'me', text: 'Hello Priya! 👋', time: '11:20 AM', read: true },
      { id: 'm2', sender: 'them', text: 'Hello! Namaste 🙏', time: '11:21 AM' },
      { id: 'm3', sender: 'them', text: 'I liked your profile.', time: '11:22 AM' },
      { id: 'm4', sender: 'me', text: 'Thank you! 😊', time: '11:23 AM', read: true },
      { id: 'm5', sender: 'them', text: 'Would you like to know more about each other?', time: '11:24 AM' },
      { id: 'm6', sender: 'me', text: 'Yes, sure 😊', time: '11:24 AM', read: true },
    ],
    c2: [
      { id: 'm1', sender: 'them', text: 'Hello 👋', time: '10:15 AM' },
    ],
  }

  const handleSendMessage = (chatId) => {
    if (!newMessageText.trim()) return
    const newMsg = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: newMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || initialConversation[chatId] || []), newMsg],
    }))

    setChatsList((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, lastMessage: newMessageText, time: 'Just now', unreadCount: 0 } : c
      )
    )

    setNewMessageText('')
  }

  // Interests state data
  const [interestsData, setInterestsData] = useState([
    {
      id: 'int-1',
      name: 'Priya Sharma',
      age: 26,
      city: 'Jaipur',
      date: '12 May 2024',
      status: 'Received',
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'int-2',
      name: 'Anjali Verma',
      age: 28,
      city: 'Jodhpur',
      date: '10 May 2024',
      status: 'Received',
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'int-3',
      name: 'Neha Agarwal',
      age: 27,
      city: 'Ajmer',
      date: '08 May 2024',
      status: 'Received',
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'int-4',
      name: 'Rohan Bansal',
      age: 29,
      city: 'Mumbai',
      date: '05 May 2024',
      status: 'Sent',
      isOnline: false,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    },
  ])

  const handleUpdateInterestStatus = (id, newStatus, e) => {
    e?.stopPropagation()
    setInterestsData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
  }

  const [recentSearches, setRecentSearches] = useState([
    {
      id: 'r1',
      title: 'Priya Sharma, 26',
      subtitle: 'Jaipur, Rajasthan',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'r2',
      title: 'Software Engineer',
      subtitle: 'Delhi',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
  ])

  const removeRecentSearch = (id, e) => {
    e.stopPropagation()
    setRecentSearches((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleFavorite = (id, e) => {
    e?.stopPropagation()
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleInterest = (id, e) => {
    e?.stopPropagation()
    setInterested((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const matchesList = [
    {
      id: 'P101',
      name: 'Riya Sharma',
      age: 26,
      height: "5'4\"",
      city: 'Jaipur, Rajasthan',
      profession: 'Software Engineer at TCS',
      education: 'MBA • Hindu, Agarwal',
      compatibility: 95,
      isPremium: true,
      verified: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'P102',
      name: 'Anjali Verma',
      age: 28,
      height: "5'5\"",
      city: 'Jodhpur, Rajasthan',
      profession: 'Senior Product Designer',
      education: 'B.Des • Hindu, Agarwal',
      compatibility: 93,
      isPremium: true,
      verified: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'P103',
      name: 'Kavya Singh',
      age: 27,
      height: "5'3\"",
      city: 'Ajmer, Rajasthan',
      profession: 'Chartered Accountant (CA)',
      education: 'M.Com • Hindu, Agarwal',
      compatibility: 91,
      isPremium: false,
      verified: true,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'P104',
      name: 'Aman Singhal',
      age: 29,
      height: "6'0\"",
      city: 'Delhi NCR',
      profession: 'MD Internal Medicine',
      education: 'MBBS • Hindu, Agarwal',
      compatibility: 90,
      isPremium: true,
      verified: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    },
  ]

  const todayMatches = [
    {
      id: 'P101',
      name: 'Priya Sharma',
      age: 26,
      height: "5'4\"",
      city: 'Jaipur',
      matchScore: 95,
      gotra: 'Garg',
      education: 'B.Tech CS, Senior Developer',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'P102',
      name: 'Anjali Verma',
      age: 28,
      height: "5'5\"",
      city: 'Jodhpur',
      matchScore: 93,
      gotra: 'Bansal',
      education: 'MBA Marketing Lead',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'P103',
      name: 'Kavya Singh',
      age: 27,
      height: "5'3\"",
      city: 'Ajmer',
      matchScore: 91,
      gotra: 'Goyal',
      education: 'Chartered Accountant',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    },
  ]

  const popularTags = [
    'Software Engineer',
    'MBA',
    'Doctor',
    'CA',
    'Jaipur',
    'Delhi',
    'Agarwal',
    'Marwari',
  ]

  const quickFilterGrid = [
    { id: 'age', label: 'Age', icon: 'schedule' },
    { id: 'height', label: 'Height', icon: 'height' },
    { id: 'religion', label: 'Religion', icon: 'auto_awesome' },
    { id: 'caste', label: 'Caste', icon: 'diversity_3' },
    { id: 'education', label: 'Education', icon: 'school' },
    { id: 'profession', label: 'Profession', icon: 'work' },
    { id: 'location', label: 'Location', icon: 'location_on' },
    { id: 'more', label: 'More Filters', icon: 'tune' },
  ]

  const filteredSearchList = matchesList.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.profession.toLowerCase().includes(q) ||
      item.education.toLowerCase().includes(q)
    )
  })

  // Filtered interests by tab
  const filteredInterests = interestsData.filter((item) => item.status === interestsTab)

  const notificationsList = [
    {
      id: 'n1',
      category: 'Interests',
      title: 'Priya Sharma accepted your interest.',
      time: '2 min ago',
      unread: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'n2',
      category: 'Messages',
      title: 'You have a new message from Anjali Verma',
      time: '10 min ago',
      unread: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'n3',
      category: 'Matches',
      title: 'Your profile was viewed by 15 members today',
      time: '1 hour ago',
      unread: true,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'n4',
      category: 'All',
      title: 'Your profile is 75% complete',
      subtitle: 'Complete now to get more matches',
      time: '2 hours ago',
      unread: true,
      isProgressRing: true,
      progressPercent: 75,
    },
  ]

  return (
    <div className="bg-[#fcfaf7] text-slate-800 font-body min-h-screen flex flex-col justify-between pb-24 select-none">
      {/* Dynamic Main View */}
      {activeTab === 'Notifications' ? (
        /* NOTIFICATIONS PAGE VIEW */
        <div className="px-4 pt-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate('/home')}
              className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition text-slate-800"
              aria-label="Back to Home"
            >
              <span className="material-symbols-outlined text-2xl block">arrow_back</span>
            </button>
            <h1 className="text-lg font-extrabold text-slate-900">Notifications</h1>
          </div>

          {/* Sub Navigation Filter Tabs */}
          <div className="flex border-b border-gray-200/80 mb-5">
            {['All', 'Matches', 'Interests', 'Messages'].map((tab) => {
              const isActive = notificationsTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setNotificationsTab(tab)}
                  className={`flex-1 pb-2.5 text-xs md:text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-[#570013] font-bold border-b-2 border-[#570013]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Notification List */}
          <div className="space-y-4 mb-6">
            {notificationsList
              .filter((item) => notificationsTab === 'All' || item.category === notificationsTab || item.category === 'All')
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100/90 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.isProgressRing ? (
                      <div className="relative w-12 h-12 rounded-full border-2 border-amber-300 bg-amber-50 text-[#570013] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <span className="material-symbols-outlined text-xl">account_circle</span>
                      </div>
                    ) : (
                      <img
                        src={item.image}
                        alt="Notification avatar"
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100 shadow-2xs"
                      />
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-snug truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {item.time}
                      </span>
                    </div>
                  </div>

                  {/* Red Unread Dot */}
                  {item.unread && (
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full flex-shrink-0" />
                  )}
                </div>
              ))}
          </div>

          {/* View All Notifications Button */}
          <div className="text-center py-3">
            <button className="text-xs font-bold text-[#570013] hover:underline cursor-pointer">
              View All Notifications
            </button>
          </div>
        </div>
      ) : activeTab === 'Profile' ? (
        /* PROFILE PAGE VIEW */
        <div className="pb-6">
          {/* Top Maroon Profile Banner */}
          <div className="bg-gradient-to-b from-[#570013] to-[#7a0d1c] text-white pt-6 pb-14 px-5 rounded-b-3xl relative">
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              <div className="relative w-20 h-20 rounded-full border-4 border-amber-300/80 shadow-lg overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300"
                  alt="Rahul Sharma"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* User Details & Edit Profile Button */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h1 className="text-xl font-bold truncate">Rahul Sharma</h1>
                  <span className="w-4.5 h-4.5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs" title="Verified Member">
                    ✓
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium mb-3 flex items-center">
                  <span>MHM123456</span>
                  {isPremiumUser && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-300/50 text-amber-200 text-[10px] font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                      Premium Gold
                    </span>
                  )}
                </p>

                <button className="px-4 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shadow-2xs active:scale-95 transition">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Completion Overlapping Card */}
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-amber-100/90 -mt-8 mx-5 relative z-20 mb-6 flex items-center justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-xs font-bold text-slate-800 mb-1">Profile Completion</h2>
              <p className="text-xs text-slate-500 max-w-[190px] leading-snug mb-3">
                Complete your profile to get better matches
              </p>
              <button 
                onClick={() => navigate('/profile-completion-dashboard')}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ffd375] to-[#f5ab2b] text-[#570013] font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition"
              >
                Complete Now
              </button>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-amber-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500"
                  strokeDasharray="75, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-bold text-[#570013] text-xs">75%</span>
            </div>
          </div>

          {/* Menu Action Tiles Grid (2 Rows x 4 Columns) */}
          <div className="px-3.5">
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'my-profile', label: 'My Profile', icon: 'person_pin' },
                { id: 'premium', label: 'Premium', icon: 'workspace_premium', isGold: true },
                { id: 'interests', label: 'Interests', icon: 'favorite', badge: '5' },
                { id: 'visitors', label: 'Visitors', icon: 'group' },
                { id: 'saved', label: 'Saved', icon: 'bookmark' },
                { id: 'blocked', label: 'Blocked', icon: 'block' },
                { id: 'settings', label: 'Settings', icon: 'settings' },
                { id: 'help', label: 'Help & Support', icon: 'support_agent' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'interests') handleTabNavigate('Interests')
                    else if (item.id === 'premium') navigate('/membership')
                    else if (item.id === 'settings') navigate('/settings')
                  }}
                  className="flex flex-col items-center justify-center p-2.5 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-amber-50/30 active:scale-95 transition min-h-[85px]"
                >
                  <div className="relative mb-2 flex items-center justify-center">
                    <span
                      className={`material-symbols-outlined text-2xl ${
                        item.isGold ? 'text-amber-600' : 'text-[#6e0b18]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2.5 w-4.5 h-4.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-800 leading-tight text-center w-full px-0.5 whitespace-normal break-words">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'Messages' ? (
        /* MESSAGES / CHATS PAGE VIEW */
        selectedChat ? (
          /* CONVERSATION THREAD VIEW */
          <div className="absolute inset-0 w-full h-full bg-[#fff8ee] z-50 flex flex-col overflow-hidden">
            {/* Thread Header (Fixed Top) */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200/70 px-4 py-3 flex items-center justify-between z-30 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-1 rounded-full hover:bg-gray-100 transition text-slate-800"
                  aria-label="Back to chats"
                >
                  <span className="material-symbols-outlined text-2xl block">arrow_back</span>
                </button>
                <div className="relative w-9 h-9 rounded-full flex-shrink-0">
                  <img
                    src={selectedChat.image}
                    alt={selectedChat.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {selectedChat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-xs md:text-sm text-slate-900 leading-tight">
                    {selectedChat.name}
                  </h2>
                  <p className="text-[10px] text-emerald-600 font-semibold">Online</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700">
                <button className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition">
                  <span className="material-symbols-outlined text-xl block">call</span>
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition">
                  <span className="material-symbols-outlined text-xl block">videocam</span>
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition">
                  <span className="material-symbols-outlined text-xl block">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages Thread Body (Only Messages Scrollable) */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3 bg-[#fff8ee]">
              {/* Date Tag Pill */}
              <div className="flex justify-center my-2">
                <span className="px-3.5 py-1 bg-white border border-amber-100 text-slate-600 text-[11px] font-bold rounded-full shadow-2xs">
                  Today
                </span>
              </div>

              {(chatMessages[selectedChat.id] || initialConversation[selectedChat.id] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-normal shadow-2xs flex flex-wrap items-end gap-2 ${
                      msg.sender === 'me'
                        ? 'bg-[#ffe6c9] text-slate-900 rounded-tr-none'
                        : 'bg-white border border-amber-100/70 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <span>{msg.text}</span>
                    <div className="flex items-center gap-1 ml-auto pt-1 text-[10px] text-slate-400">
                      <span>{msg.time}</span>
                      {msg.sender === 'me' && (
                        <span className="text-blue-500 font-bold text-xs leading-none">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Box (Fixed Bottom) */}
            <div className="flex-shrink-0 p-3 bg-[#fff8ee] border-t border-amber-200/40 flex items-center gap-2 z-30">
              <div className="flex-1 bg-white border border-amber-200/80 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xs focus-within:border-[#570013]">
                <button type="button" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-lg block">attach_file</span>
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(selectedChat.id)}
                  className="flex-1 bg-transparent text-xs font-medium text-slate-900 focus:outline-none placeholder-gray-400 min-w-0"
                />
                <button type="button" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-lg block">photo_camera</span>
                </button>
              </div>

              <button
                onClick={() => handleSendMessage(selectedChat.id)}
                className="w-9 h-9 rounded-full bg-[#570013] text-white flex items-center justify-center shadow hover:bg-[#72001a] active:scale-95 transition flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base block">
                  {newMessageText.trim() ? 'send' : 'mic'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* CHATS LIST VIEW */
          <div className="px-4 pt-3 relative min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={() => navigate('/home')}
                className="p-0.5 rounded-full hover:bg-amber-50 active:scale-95 transition text-[#570013] -ml-1"
                aria-label="Back to Home"
              >
                <span className="material-symbols-outlined text-2xl block">arrow_back</span>
              </button>
              <h1 className="text-lg font-display font-extrabold text-[#570013] flex-1">Chats</h1>
              <button 
                onClick={() => handleTabNavigate('Search')}
                className="p-1 rounded-full hover:bg-amber-50 active:scale-95 transition text-[#570013]"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-xl block">search</span>
              </button>
            </div>

            {/* Category Tabs (Chats / Calls) */}
            <div className="flex border-b border-gray-200/80 mb-4">
              {['Chats', 'Calls'].map((tab) => {
                const isActive = chatsTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setChatsTab(tab)}
                    className={`flex-1 pb-2.5 text-xs md:text-sm font-semibold transition-all relative ${
                      isActive
                        ? 'text-[#570013] font-bold border-b-2 border-[#570013]'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            {/* Chats List */}
            {chatsTab === 'Chats' ? (
              <div className="divide-y divide-gray-100 bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
                {chatsList.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat)
                      setChatsList((prev) =>
                        prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
                      )
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-amber-50/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full flex-shrink-0">
                        <img
                          src={chat.image}
                          alt={chat.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                        {chat.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Chat details */}
                      <div className="min-w-0 flex-grow">
                        <h3 className="font-bold text-xs md:text-sm text-slate-900 truncate">
                          {chat.name}
                        </h3>
                        <p
                          className={`text-xs truncate ${
                            chat.isTyping
                              ? 'text-emerald-600 font-semibold'
                              : chat.unreadCount > 0
                              ? 'text-slate-900 font-semibold'
                              : 'text-slate-400 font-medium'
                          }`}
                        >
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>

                    {/* Time & Badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[11px] text-gray-400 font-medium">{chat.time}</span>
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-2xs">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">call</span>
                <p className="text-sm font-semibold text-slate-700">No recent calls</p>
                <p className="text-xs text-slate-400">Audio and video calls will show up here</p>
              </div>
            )}

            {/* Floating Action Button: + New Chat */}
            <button
              onClick={() => setSelectedChat(chatsList[0])}
              className="fixed bottom-24 right-6 bg-[#570013] hover:bg-[#72001a] text-white px-5 py-3 rounded-full shadow-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition z-40"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>New Chat</span>
            </button>
          </div>
        )
      ) : activeTab === 'Interests' ? (
        /* INTERESTS PAGE VIEW */
        <div className="px-4 pt-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate('/home')}
              className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition text-slate-800"
              aria-label="Back to Home"
            >
              <span className="material-symbols-outlined text-2xl block">arrow_back</span>
            </button>
            <h1 className="text-lg font-extrabold text-slate-900">Interests</h1>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-gray-200/80 mb-5">
            {['Received', 'Sent', 'Accepted', 'Declined'].map((tab) => {
              const isActive = interestsTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setInterestsTab(tab)}
                  className={`flex-1 pb-2.5 text-xs md:text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-[#570013] font-bold border-b-2 border-[#570013]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Interests Cards List */}
          <div className="space-y-4">
            {filteredInterests.length > 0 ? (
              filteredInterests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 border border-gray-100/90 shadow-sm flex flex-col gap-3 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3.5">
                    {/* User Avatar with Online Badge */}
                    <div className="relative w-14 h-14 rounded-full flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full rounded-full object-cover border border-gray-200"
                      />
                      {item.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate mb-0.5">
                        {item.age}, {item.city}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {item.status === 'Received' ? `Received on ${item.date}` : `Sent on ${item.date}`}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons for Received tab */}
                  {interestsTab === 'Received' && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={(e) => handleUpdateInterestStatus(item.id, 'Accepted', e)}
                        className="flex-1 py-2.5 rounded-2xl bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs shadow transition active:scale-95 text-center"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => handleUpdateInterestStatus(item.id, 'Declined', e)}
                        className="flex-1 py-2.5 rounded-2xl bg-white border border-[#570013] text-[#570013] font-bold text-xs hover:bg-red-50 transition active:scale-95 text-center"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {interestsTab === 'Accepted' && (
                    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Interest Accepted • Contact Details Unlocked</span>
                    </div>
                  )}

                  {interestsTab === 'Declined' && (
                    <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-400 bg-gray-50 px-3 py-2 rounded-xl">
                      <span>Interest Declined</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">person_search</span>
                <p className="text-sm font-semibold text-slate-700">No {interestsTab.toLowerCase()} interests</p>
                <p className="text-xs text-slate-400">Interests will appear here as members connect with you</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'Search' ? (
        /* SEARCH PAGE VIEW */
        <div className="px-4 pt-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => navigate('/home')}
              className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition text-slate-800"
              aria-label="Back to Home"
            >
              <span className="material-symbols-outlined text-2xl block">arrow_back</span>
            </button>
            <h1 className="text-lg font-extrabold text-slate-900">Search</h1>
          </div>

          {/* Search Bar Input Row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-11 bg-white border border-gray-200/90 rounded-2xl px-3 flex items-center gap-2 shadow-sm focus-within:border-[#570013] focus-within:ring-1 focus-within:ring-[#570013] transition">
              <span className="material-symbols-outlined text-gray-400 text-lg flex-shrink-0">search</span>
              <input
                type="text"
                placeholder="Search by Name, ID or Keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-base block">close</span>
                </button>
              )}
            </div>

            {/* Filter Funnel Icon Button */}
            <button
              onClick={() => setActiveFilter(activeFilter ? null : 'all')}
              className={`w-11 h-11 rounded-2xl border transition shadow-sm flex items-center justify-center flex-shrink-0 ${
                activeFilter
                  ? 'bg-[#570013] text-white border-[#570013]'
                  : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg block">tune</span>
            </button>
          </div>

          {/* If user is typing in search input, show filtered results */}
          {searchQuery.trim() ? (
            <div className="space-y-3 mb-5">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Search Results ({filteredSearchList.length})
              </h2>

              {filteredSearchList.length > 0 ? (
                filteredSearchList.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectProfile && onSelectProfile(match)}
                    className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={match.image}
                      alt={match.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-xs text-slate-900 truncate">
                        {match.name}, {match.age}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">{match.city}</p>
                      <p className="text-[10px] text-[#570013] font-semibold truncate">{match.profession}</p>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex-shrink-0">
                      {match.compatibility}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-1 block">search_off</span>
                  <p className="text-xs font-semibold text-slate-700">No profiles found</p>
                  <p className="text-[11px] text-slate-400">Try searching for another keyword or location</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Filter Tiles Grid (2 Rows x 4 Columns) */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {quickFilterGrid.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSearchQuery(filter.label)}
                    className="flex flex-col items-center justify-center py-2.5 px-1 bg-white border border-gray-100/90 rounded-2xl shadow-2xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-95 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-50/80 text-[#570013] flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-base">{filter.icon}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center truncate w-full px-0.5">
                      {filter.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Popular Searches */}
              <div className="mb-4">
                <h2 className="text-xs font-bold text-slate-900 mb-2">Popular Searches</h2>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1 bg-white border border-gray-200/80 rounded-full text-[11px] font-semibold text-slate-700 hover:border-[#570013] hover:text-[#570013] hover:bg-amber-50/30 transition shadow-2xs"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-slate-900 mb-2">Recent Searches</h2>
                  <div className="space-y-2">
                    {recentSearches.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSearchQuery(item.title.split(',')[0])}
                        className="bg-white border border-gray-100/90 rounded-xl p-2 flex items-center justify-between shadow-2xs hover:bg-gray-50/70 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                            <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => removeRecentSearch(item.id, e)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                          aria-label="Remove search"
                        >
                          <span className="material-symbols-outlined text-xs block">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'Matches' ? (
        /* MATCHES PAGE VIEW */
        <div className="px-5 pt-4">
          {/* Header */}
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => navigate('/home')}
              className="p-0.5 rounded-full hover:bg-amber-50 active:scale-95 transition text-[#570013] -ml-1"
              aria-label="Back to Home"
            >
              <span className="material-symbols-outlined text-2xl block">arrow_back</span>
            </button>
            <h1 className="text-lg font-display font-extrabold text-[#570013] flex-1">Matches</h1>
            <button 
              onClick={() => handleTabNavigate('Notifications')}
              className="p-1 rounded-full hover:bg-amber-50 active:scale-95 transition text-[#570013]"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-xl block">notifications</span>
            </button>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex border-b border-gray-200/80 mb-5">
            {['Recommended', 'New Members', 'Nearby'].map((cat) => {
              const isActive = matchesCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setMatchesCategory(cat)}
                  className={`flex-1 pb-2.5 text-xs md:text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-[#570013] font-bold border-b-2 border-[#570013]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Matches List */}
          <div className="space-y-5">
            {matchesList.map((match) => (
              <div
                key={match.id}
                onClick={() => onSelectProfile && onSelectProfile(match)}
                className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                {/* Candidate Image Card */}
                <div className="w-full h-64 rounded-2xl overflow-hidden relative bg-gray-100 mb-4">
                  <img
                    src={match.image}
                    alt={match.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Premium Badge */}
                  {match.isPremium && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-[#6e0b18] to-[#8f1224] text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
                      <span className="text-amber-300">⭐</span>
                      <span>Premium</span>
                    </div>
                  )}

                  {/* Heart Action Button */}
                  <button
                    onClick={(e) => toggleFavorite(match.id, e)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition"
                  >
                    <span
                      className={`material-symbols-outlined text-base ${
                        favorites[match.id] ? 'text-red-600' : 'text-red-600'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </button>
                </div>

                {/* Candidate Info Details */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h2 className="text-lg font-bold text-slate-900">
                      {match.name}, {match.age}
                    </h2>
                    {match.verified && (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold" title="Verified Profile">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-3">
                    {match.height} • {match.city}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-base">work</span>
                      <span>{match.profession}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-base">school</span>
                      <span>{match.education}</span>
                    </p>
                  </div>
                </div>

                {/* Compatibility & Interested Action Row */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  {/* Compatibility Badge */}
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl text-center">
                    <span className="block text-sm font-extrabold text-emerald-700 leading-tight">
                      {match.compatibility}%
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 tracking-tight">
                      Compatibility
                    </span>
                  </div>

                  {/* Interested Button */}
                  <button
                    onClick={(e) => toggleInterest(match.id, e)}
                    className={`flex-1 py-3 px-5 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                      interested[match.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#570013] hover:bg-[#72001a] text-white'
                    }`}
                  >
                    <span>{interested[match.id] ? 'Interest Sent' : 'Interested'}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* HOME PAGE VIEW */
        <div className="px-5 pt-4">
          {/* Clean Top App Bar */}
          <div className="-mx-5 -mt-4 px-5 pt-5 pb-4 bg-[#f2ebd9] border-b border-[#e6dfd1]/80 flex items-center justify-between mb-6 shadow-sm">
            {/* Left side: Avatar + Greeting */}
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#775a19] to-amber-300 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200"
                  alt="Rahul Sharma Profile"
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#775a19] font-bold uppercase tracking-wider mb-0.5">Welcome back,</p>
                <h1 className="text-lg font-extrabold text-[#570013] leading-tight truncate max-w-[150px]">
                  Rahul Sharma
                </h1>
              </div>
            </div>

            {/* Right side: Notification */}
            <div 
              onClick={() => handleTabNavigate('Notifications')}
              className="relative p-2.5 bg-white rounded-full shadow-sm border border-[#e6dfd1]/80 hover:bg-amber-50 active:scale-95 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#570013] text-xl block">notifications</span>
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-600 border-2 border-white rounded-full" />
            </div>
          </div>

          {/* Compact Profile Completion Banner */}
          <div className="bg-gradient-to-r from-[#6e0b18] via-[#7d0d1c] to-[#50040f] rounded-2xl p-3.5 text-white shadow-lg relative overflow-hidden mb-4">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex-1">
                <h2 className="text-[11px] font-semibold text-amber-200/90 tracking-wide mb-1">
                  Profile Completion
                </h2>

                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/15">
                    <span className="material-symbols-outlined text-amber-300 text-xs">badge</span>
                  </div>
                  <p className="text-[11px] text-white/90 leading-tight">
                    Your profile is <span className="font-bold text-amber-300">75% complete</span>.
                  </p>
                </div>

                <button className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ffd375] to-[#f5ab2b] text-[#570013] font-bold text-[11px] shadow hover:brightness-105 active:scale-95 transition-all">
                  Complete Now
                </button>
              </div>

              {/* Progress Ring */}
              <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/15"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-300"
                    strokeDasharray="75, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-bold text-amber-300 text-xs">75%</span>
              </div>
            </div>
          </div>

          {/* Today's Matches Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Today's Matches</h2>
              <button
                onClick={() => navigate('/matches')}
                className="text-xs font-bold text-[#6e0b18] hover:underline cursor-pointer"
              >
                See All
              </button>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none -mx-1 px-1">
              {todayMatches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => onSelectProfile && onSelectProfile(match)}
                  className="w-36 flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-2 shadow-sm hover:shadow-md transition cursor-pointer relative group"
                >
                  <div className="w-full h-36 rounded-xl overflow-hidden relative bg-gray-100 mb-2">
                    <img
                      src={match.image}
                      alt={match.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => toggleFavorite(match.id, e)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition"
                    >
                      <span
                        className={`material-symbols-outlined text-sm ${
                          favorites[match.id] ? 'text-red-600' : 'text-red-500'
                        }`}
                        style={{ fontVariationSettings: favorites[match.id] ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>

                  <div className="px-0.5">
                    <h3 className="font-bold text-xs text-slate-900 truncate mb-0.5">{match.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium truncate mb-1.5">
                      {match.age} • {match.height}
                      <br />
                      <span className="text-slate-400">{match.city}</span>
                    </p>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{match.matchScore}% Match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h2>

            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'search', label: 'Search', icon: 'search' },
                { id: 'interests', label: 'Interests', icon: 'person_search' },
                { id: 'messages', label: 'Messages', icon: 'chat', badge: '5' },
                { id: 'visitors', label: 'Visitors', icon: 'group' },
              ].map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'search') handleTabNavigate('Search')
                    else if (action.id === 'interests') handleTabNavigate('Interests')
                    else if (action.id === 'messages') handleTabNavigate('Messages')
                  }}
                  className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-amber-50/40 transition active:scale-95"
                >
                  <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/60 text-[#6e0b18] flex items-center justify-center mb-1.5">
                    <span className="material-symbols-outlined text-xl">{action.icon}</span>
                    {action.badge && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar */}
      {!selectedChat && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200/80 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2 flex items-center justify-around z-50">
          {[
            { id: 'Home', label: 'Home', icon: 'home' },
            { id: 'Matches', label: 'Matches', icon: 'favorite' },
            { id: 'Messages', label: 'Messages', icon: 'chat', badge: '5' },
            { id: 'Membership', label: 'Premium', icon: 'workspace_premium' },
            { id: 'Profile', label: 'Profile', icon: 'account_circle' },
          ].map((tab) => {
            const isActive = activeTab === tab.id || (activeTab === 'Notifications' && tab.id === 'Home') // Failsafe for route match
            return (
              <button
                key={tab.id}
                onClick={() => handleTabNavigate(tab.id)}
                className="flex flex-col items-center justify-center relative py-1 px-2 text-center transition"
              >
                <div className="relative">
                  <span
                    className={`material-symbols-outlined text-2xl transition-colors ${
                      isActive ? 'text-[#6e0b18]' : 'text-gray-400'
                    }`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {tab.icon}
                  </span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold mt-0.5 transition-colors ${
                    isActive ? 'text-[#6e0b18]' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active Tab Underline */}
                {isActive && (
                  <div className="w-5 h-0.5 bg-[#6e0b18] rounded-full mt-0.5 animate-scale-fade" />
                )}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
