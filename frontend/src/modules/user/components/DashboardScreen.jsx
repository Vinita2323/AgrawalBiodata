import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import HeaderBar from './HeaderBar'

export default function DashboardScreen({ initialTab, onSelectProfile, onBack, isPremiumUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const biodataRef = useRef(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleDownloadPDF = async () => {
    if (isExportingPdf) return
    const element = biodataRef.current
    if (!element) {
      showToast('Profile element not found for PDF export.', 'error')
      return
    }

    setIsExportingPdf(true)

    // Allow UI thread to repaint spinner & disabled button state before heavy canvas processing
    setTimeout(async () => {
      try {
        const rawName = userProfile?.fullName ? userProfile.fullName.trim().replace(/\s+/g, '_') : 'Profile'
        const formattedFilename = `Biodata_${rawName}.pdf`

        // Clone element for rendering
        const clone = element.cloneNode(true)
        clone.style.width = '794px' // Standard A4 width in pixels at 96 DPI
        clone.style.padding = '24px'
        clone.style.backgroundColor = '#ffffff'

        const nonPrintable = clone.querySelectorAll('.print\\:hidden, button')
        nonPrintable.forEach(node => node.remove())

        const pdfOnly = clone.querySelectorAll('.pdf-only')
        pdfOnly.forEach(node => {
          node.classList.remove('hidden')
          node.style.display = 'block'
        })

        // Temporarily mount clone offscreen to resolve layout styles
        clone.style.position = 'fixed'
        clone.style.top = '-9999px'
        clone.style.left = '-9999px'
        document.body.appendChild(clone)

        // Convert cloned element to canvas with optimized scale
        const canvas = await html2canvas(clone, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc) => {
            const allEls = clonedDoc.querySelectorAll('*')
            allEls.forEach(el => {
              try {
                const style = window.getComputedStyle(el)
                if (style.color && (style.color.includes('oklch') || style.color.includes('oklab'))) {
                  el.style.color = '#1b1c1a'
                }
                if (style.backgroundColor && (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab'))) {
                  el.style.backgroundColor = '#ffffff'
                }
                if (style.borderColor && (style.borderColor.includes('oklab') || style.borderColor.includes('oklch'))) {
                  el.style.borderColor = '#e6dfd1'
                }
                if (style.backgroundImage && (style.backgroundImage.includes('oklch') || style.backgroundImage.includes('oklab'))) {
                  el.style.backgroundImage = 'none'
                  el.style.backgroundColor = '#fef3c7'
                }
                if (style.boxShadow && (style.boxShadow.includes('oklch') || style.boxShadow.includes('oklab'))) {
                  el.style.boxShadow = 'none'
                }
                if (style.textShadow && (style.textShadow.includes('oklch') || style.textShadow.includes('oklab'))) {
                  el.style.textShadow = 'none'
                }
              } catch (e) {}
            })
          }
        })

      // Clean up DOM clone
      document.body.removeChild(clone)

      // Create jsPDF document
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 5) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      // Convert PDF to Blob and trigger direct programmatic download
      const pdfBlob = pdf.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)
      const downloadLink = document.createElement('a')
      downloadLink.href = blobUrl
      downloadLink.download = formattedFilename
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      URL.revokeObjectURL(blobUrl)

      showToast('PDF downloaded successfully.', 'success')
    } catch (err) {
      console.error('PDF export error:', err)
      showToast('Failed to generate PDF. Please try again.', 'error')
    } finally {
      setIsExportingPdf(false)
    }
    }, 50)
  }

  const [activeTab, setActiveTab] = useState(initialTab || 'Home') // 'Home' | 'Matches' | 'Search' | 'Interests' | 'Messages' | 'Notifications' | 'Profile'
  const [matchesCategory, setMatchesCategory] = useState('All')
  const [interestsTab, setInterestsTab] = useState('Received')
  const [chatsTab, setChatsTab] = useState('Chats') // 'Chats' | 'Calls'
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [newMessageText, setNewMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [favorites, setFavorites] = useState({})
  const [interested, setInterested] = useState({})

  const [activeModal, setActiveModal] = useState(null) // 'Visitors' | 'Saved' | 'Blocked' | 'Help & Support'
  const [notificationsTab, setNotificationsTab] = useState('All')
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile))
    }
  }, [])

  useEffect(() => {
    const path = location.pathname
    if (path === '/matches') setActiveTab('Matches')
    else if (path === '/search') setActiveTab('Search')
    else if (path === '/interests') setActiveTab('Interests')
    else if (path === '/chat' || path === '/messages') setActiveTab('Messages')
    else if (path === '/profile') {
      // Keep MyProfile active if user clicked My Details, otherwise default to main Profile
      setActiveTab(prev => prev === 'MyProfile' ? 'MyProfile' : 'Profile')
    }
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
      setActiveTab('Profile')
      if (location.pathname !== '/profile') {
        navigate('/profile')
      }
    } else if (tabId === 'Notifications') {
      navigate('/notifications')
    } else if (tabId === 'Membership') {
      navigate('/membership')
    } else if (tabId === 'MyProfile') {
      setActiveTab('MyProfile')
    }
  }

  // Chats list data
  const [chatsList, setChatsList] = useState([
    {
      id: 'c1',
      name: 'Priya Garg',
      lastMessage: 'Typing...',
      isTyping: true,
      time: '11:30 AM',
      unreadCount: 2,
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c2',
      name: 'Anjali Bansal',
      lastMessage: 'Hello 👋',
      time: '10:15 AM',
      unreadCount: 1,
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c3',
      name: 'Riya Goyal',
      lastMessage: 'Sent a photo',
      time: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c4',
      name: 'Kavya Singhal',
      lastMessage: 'Thank you 😊',
      time: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'c5',
      name: 'Neha Mittal',
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
      name: 'Priya Garg',
      age: 26,
      city: 'Jaipur',
      date: '12 May 2024',
      status: 'Received',
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'int-2',
      name: 'Anjali Bansal',
      age: 28,
      city: 'Jodhpur',
      date: '10 May 2024',
      status: 'Received',
      isOnline: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'int-3',
      name: 'Neha Goyal',
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
      title: 'Priya Garg, 26',
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
      name: 'Riya Garg',
      age: 26,
      height: "5'4\"",
      city: 'Jaipur, Rajasthan',
      profession: 'Software Engineer at TCS',
      education: 'MBA • Hindu, Agarwal',
      compatibility: 95,
      isPremium: true,
      verified: true,
      isNearby: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'P102',
      name: 'Anjali Bansal',
      age: 28,
      height: "5'5\"",
      city: 'Jodhpur, Rajasthan',
      profession: 'Senior Product Designer',
      education: 'B.Des • Hindu, Agarwal',
      compatibility: 93,
      isPremium: true,
      verified: true,
      isNearby: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'P103',
      name: 'Kavya Goyal',
      age: 27,
      height: "5'3\"",
      city: 'Ajmer, Rajasthan',
      profession: 'Chartered Accountant (CA)',
      education: 'M.Com • Hindu, Agarwal',
      compatibility: 91,
      isPremium: false,
      verified: true,
      isMockInterested: true,
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
      isNearby: false,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    },
  ]

  const todayMatches = [
    {
      id: 'P101',
      name: 'Priya Garg',
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
      name: 'Anjali Bansal',
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
      name: 'Kavya Goyal',
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
      title: 'Priya Garg accepted your interest.',
      time: '2 min ago',
      unread: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: 'n2',
      category: 'Messages',
      title: 'You have a new message from Anjali Bansal',
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
          <div className="bg-gradient-to-b from-[#570013] to-[#7a0d1c] text-white pt-4 pb-12 px-5 rounded-b-3xl relative">
            {/* Header: Logo */}
            <div className="flex justify-end mb-1">
              <span className="material-symbols-outlined text-amber-300 text-2xl opacity-80">family_star</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              <div className="relative w-20 h-20 rounded-full border-4 border-amber-300/80 shadow-lg overflow-hidden flex-shrink-0 bg-amber-100/20 flex items-center justify-center">
                {userProfile?.profilePicture ? (
                  <img
                    src={userProfile.profilePicture}
                    alt={userProfile?.fullName || 'User Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-amber-200/80 text-4xl">
                    person
                  </span>
                )}
              </div>

              {/* User Details & Edit Profile Button */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h1 className="text-xl font-bold truncate">{userProfile?.fullName || 'Rahul Garg'}</h1>
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

                <button 
                  onClick={() => navigate('/profile-completion-dashboard')}
                  className="px-4 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shadow-2xs active:scale-95 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Completion Overlapping Card */}
          <div className="bg-white rounded-lg p-4 shadow-xl border border-amber-100/90 -mt-8 mx-5 relative z-20 mb-6 flex items-center justify-between gap-3">
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
                    if (item.id === 'my-profile') handleTabNavigate('MyProfile')
                    else if (item.id === 'premium') navigate('/membership')
                    else if (item.id === 'interests') handleTabNavigate('Interests')
                    else if (item.id === 'visitors') setActiveModal('Visitors')
                    else if (item.id === 'saved') setActiveModal('Saved')
                    else if (item.id === 'blocked') setActiveModal('Blocked')
                    else if (item.id === 'settings') navigate('/settings')
                    else if (item.id === 'help') navigate('/help-support')
                  }}
                  className="flex flex-col items-center justify-center p-2.5 py-3.5 bg-white rounded-md border border-gray-100 shadow-sm hover:shadow-md hover:bg-amber-50/30 active:scale-95 transition min-h-[85px]"
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

            {/* Logout Button */}
            <button
              onClick={() => {
                localStorage.removeItem('userProfile');
                navigate('/welcome');
              }}
              className="mt-5 w-full bg-white border border-red-100 text-red-600 font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:bg-red-50 active:scale-95 transition"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </button>
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
                    className={`max-w-[80%] px-3.5 py-2 rounded-md text-xs leading-normal shadow-2xs flex flex-wrap items-end gap-2 ${
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
              <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-100 shadow-2xs overflow-hidden">
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
              <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
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
                  className="bg-white rounded-lg p-4 border border-gray-100/90 shadow-sm flex flex-col gap-3 hover:shadow-md transition"
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
                        className="flex-1 py-2.5 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs shadow transition active:scale-95 text-center"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => handleUpdateInterestStatus(item.id, 'Declined', e)}
                        className="flex-1 py-2.5 rounded-md bg-white border border-[#570013] text-[#570013] font-bold text-xs hover:bg-red-50 transition active:scale-95 text-center"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {interestsTab === 'Accepted' && (
                    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Interest Accepted • Contact Details Unlocked</span>
                    </div>
                  )}

                  {interestsTab === 'Declined' && (
                    <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-400 bg-gray-50 px-3 py-2 rounded-md">
                      <span>Interest Declined</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
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
            <div className="flex-1 h-11 bg-white border border-gray-200/90 rounded-md px-3 flex items-center gap-2 shadow-sm focus-within:border-[#570013] focus-within:ring-1 focus-within:ring-[#570013] transition">
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
              className={`w-11 h-11 rounded-md border transition shadow-sm flex items-center justify-center flex-shrink-0 ${
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
                    className="bg-white rounded-md p-2.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={match.image}
                      alt={match.name}
                      className="w-12 h-12 rounded-md object-cover flex-shrink-0"
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
                <div className="text-center py-8 bg-white rounded-md border border-gray-100">
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
                    className="flex flex-col items-center justify-center py-2.5 px-1 bg-white border border-gray-100/90 rounded-md shadow-2xs hover:border-amber-300 hover:bg-amber-50/40 active:scale-95 transition"
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
                        className="bg-white border border-gray-100/90 rounded-md p-2 flex items-center justify-between shadow-2xs hover:bg-gray-50/70 transition cursor-pointer"
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
            {['All', 'Nearby', 'Interested'].map((cat) => {
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
            {(() => {
              const filteredMatches = matchesList.filter((match) => {
                const isItemInterested = !!interested[match.id] || match.isMockInterested
                if (matchesCategory === 'Interested') {
                  // Show explicitly interested profiles or mock interested profiles
                  return isItemInterested
                } else if (matchesCategory === 'Nearby') {
                  // Show profiles in Nearby, excluding any interested profile
                  return !isItemInterested && (match.isNearby || match.city.includes('Jaipur') || match.city.includes('Rajasthan'))
                } else {
                  // 'All' tab: Show all profiles, strictly excluding any interested profile
                  return !isItemInterested
                }
              })

              if (filteredMatches.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-100 p-6">
                    <span className="material-symbols-outlined text-4xl text-amber-300 mb-2 block">favorite_border</span>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">No profiles in {matchesCategory}</h3>
                    <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                      {matchesCategory === 'Interested' 
                        ? 'Click "Interested" on candidate profiles to save them here.' 
                        : 'No profiles match this filter right now.'}
                    </p>
                  </div>
                )
              }

              return filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => onSelectProfile && onSelectProfile(match)}
                className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                {/* Candidate Image Card */}
                <div className="w-full h-64 rounded-md overflow-hidden relative bg-gray-100 mb-4">
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
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-md text-center">
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
                    className={`flex-1 py-3 px-5 rounded-md font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
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
            ))
          })()}
          </div>
        </div>
      ) : activeTab === 'MyProfile' ? (
        /* MY PROFILE VIEW */
        <div className="pb-6" ref={biodataRef}>
          <div className="hidden pdf-only mb-4">
            <HeaderBar isExport={true} />
          </div>
          <div className="bg-[#f2ebd9] px-3.5 py-2.5 border-b border-[#e6dfd1]/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTabNavigate('Profile')
                }}
                className="p-1.5 rounded-full bg-amber-100/50 hover:bg-amber-100 active:scale-90 transition text-[#570013] cursor-pointer print:hidden z-20 flex items-center justify-center"
                title="Go Back"
                type="button"
              >
                <span className="material-symbols-outlined text-lg block font-bold">arrow_back</span>
              </button>
              {/* Top Left Title */}
              <div>
                <h1 className="text-base font-extrabold text-[#570013] tracking-wide uppercase font-display leading-none">BIO DATA</h1>
                <p className="text-[9px] text-[#775a19] font-semibold print:block hidden">Agarwal Matrimony</p>
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer print:hidden ${
                isExportingPdf
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                  : 'bg-[#570013] hover:bg-[#72001a] text-white active:scale-95'
              }`}
            >
              {isExportingPdf ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg text-[11px] font-bold flex items-center gap-2 animate-bounce transition-all ${
              toastMessage.type === 'error' 
                ? 'bg-red-600 text-white' 
                : 'bg-emerald-700 text-white'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {toastMessage.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{toastMessage.text}</span>
            </div>
          )}
          <div className="p-3.5 sm:p-5 space-y-4 bg-white print:p-2">
            {userProfile ? (
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="p-1.5 space-y-2.5 relative border-b border-amber-200/60 pb-4">
                  <button onClick={() => navigate('/profile-completion-dashboard')} className="absolute top-0 right-0 p-1.5 bg-amber-50 text-[#775a19] rounded-full hover:bg-amber-100 active:scale-95 transition border border-amber-200/60 shadow-xs print:hidden" title="Edit Profile">
                    <span className="material-symbols-outlined text-[15px] block">edit</span>
                  </button>
                  <h2 className="font-bold text-[#570013] text-sm border-b-2 border-[#570013]/20 pb-1 uppercase tracking-wide">Personal Information</h2>
                  <div className="flex gap-4 mt-2">
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs flex-1">
                      <div className="text-gray-500 text-[10px] leading-tight">Full Name</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.fullName || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Gender</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.gender || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Gotra</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.gotra || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Date of Birth</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.dob || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Height</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.height || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Complexion</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.complexion || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Manglik</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.manglik || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Qualification</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.qualification || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Income</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.income || '-'}</div>
                      <div className="text-gray-500 text-[10px] leading-tight">Working At</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.workingAt || '-'}</div>
                    </div>
                    
                    <div className="w-[100px] h-[130px] bg-gray-100 rounded-md border-2 border-white shadow-sm overflow-hidden shrink-0 hidden pdf-only sm:block print:block">
                      {userProfile.profilePicture ? (
                        <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                          <span className="material-symbols-outlined text-4xl">person</span>
                          <span className="text-[9px] mt-1 uppercase font-bold text-gray-300">Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Family Details */}
                <div className="p-1.5 space-y-2.5 border-b border-amber-200/60 pb-4">
                  <h2 className="font-bold text-[#570013] text-sm border-b-2 border-[#570013]/20 pb-1 uppercase tracking-wide">Family Details</h2>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
                    <div className="text-gray-500 text-[10px] leading-tight">Grandfather</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.grandfather || '-'}</div>
                    <div className="text-gray-500 text-[10px] leading-tight">Grandmother</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.grandmother || '-'}</div>
                    <div className="text-gray-500 text-[10px] leading-tight">Father</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.father || '-'}</div>
                    <div className="text-gray-500 text-[10px] leading-tight">Mother</div><div className="font-semibold text-gray-800 text-[11px]">{userProfile.mother || '-'}</div>

                    {/* Helper to render list or string */}
                    {[
                      { key: 'brotherList', strKey: 'brothers', label: 'Brothers', spouseLabel: 'Wife' },
                      { key: 'sisterList', strKey: 'sisters', label: 'Sisters', spouseLabel: 'Husband' },
                      { key: 'taujiList', strKey: 'tauji', label: 'Tauji', spouseLabel: 'Taiji' },
                      { key: 'chachaList', strKey: 'chacha', label: 'Chacha', spouseLabel: 'Chachi' },
                      { key: 'buajiList', strKey: 'buaji', label: 'Bua Ji', spouseLabel: 'Phupha Ji' },
                    ].map((rel) => {
                      const list = userProfile[rel.key]
                      const hasList = Array.isArray(list) && list.some(item => item.name || item.spouseName)
                      return (
                        <React.Fragment key={rel.key}>
                          <div className="text-gray-500 text-[11px] leading-tight">{rel.label}</div>
                          <div className="font-semibold text-gray-800 text-xs">
                            {hasList ? (
                              <div className="space-y-1">
                                {list.filter(item => item.name || item.spouseName).map((item, idx) => (
                                  <div key={idx} className="leading-tight">
                                    <span>{item.name || `${rel.label} ${idx + 1}`} ({item.status || 'Unmarried'})</span>
                                    {item.status === 'Married' && (item.spouseName || item.homePlace) && (
                                      <div className="text-[10px] text-gray-600 font-normal">
                                        {rel.spouseLabel}: {item.spouseName || '-'} {item.homePlace ? `(${item.homePlace})` : ''}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              userProfile[rel.strKey] || '-'
                            )}
                          </div>
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>

                {/* Maternal Details */}
                <div className="p-2 space-y-3 pb-2">
                  <h2 className="font-bold text-[#570013] text-base border-b-2 border-[#570013]/20 pb-1.5 uppercase tracking-wide">Maternal Details</h2>
                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div>
                      <div className="text-gray-500 text-[11px] mb-0.5">Mama Ji</div>
                      <div className="font-semibold text-gray-800 text-xs">
                        {Array.isArray(userProfile.mamajiList) && userProfile.mamajiList.some(item => item.name || item.spouseName) ? (
                          <div className="space-y-1">
                            {userProfile.mamajiList.filter(item => item.name || item.spouseName).map((item, idx) => (
                              <div key={idx} className="leading-tight">
                                <span>{item.name || `Mama Ji ${idx + 1}`} ({item.status || 'Unmarried'})</span>
                                {item.status === 'Married' && (item.spouseName || item.homePlace) && (
                                  <div className="text-[10px] text-gray-600 font-normal">
                                    Mami Ji: {item.spouseName || '-'} {item.homePlace ? `(${item.homePlace})` : ''}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          userProfile.mamaji || '-'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                No profile details found. Please complete your profile.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HOME PAGE VIEW */
        <div className="px-5 pt-4">
          {/* Clean Top App Bar */}
          <div className="-mx-5 -mt-4 px-5 pt-5 pb-4 bg-[#f2ebd9] border-b border-[#e6dfd1]/80 flex items-center justify-between mb-6 shadow-sm">
            {/* Left side: Avatar + Greeting */}
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#775a19] to-amber-300 shadow-sm flex items-center justify-center overflow-hidden bg-amber-50">
                {userProfile?.profilePicture ? (
                  <img
                    src={userProfile.profilePicture}
                    alt={userProfile?.fullName ? `${userProfile.fullName} Profile` : "User Profile"}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#775a19]">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-[#775a19] font-bold uppercase tracking-wider mb-0.5">Welcome back,</p>
                <h1 className="text-lg font-extrabold text-[#570013] leading-tight truncate max-w-[150px]">
                  {userProfile?.fullName || 'Rahul Garg'}
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

          {/* Bio Data Action Card */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-100/60 to-amber-500/15 border border-amber-300/80 rounded-xl p-3.5 mb-3 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Icon & Visible Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#570013] text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#570013] tracking-wide uppercase leading-tight">
                    Your Bio Data
                  </h2>
                  <p className="text-[10px] text-[#775a19] font-semibold leading-tight mt-0.5">
                    View profile preview or download PDF
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleTabNavigate('MyProfile')}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 text-[#570013] font-bold text-xs hover:bg-amber-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                  title="View Bio Data"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTabNavigate('MyProfile')
                    setTimeout(() => {
                      handleDownloadPDF()
                    }, 300)
                  }}
                  disabled={isExportingPdf}
                  className="px-3.5 py-1.5 rounded-lg bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                  title="Download PDF Resume"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compact Profile Completion Banner */}
          <div className="bg-gradient-to-r from-[#6e0b18] via-[#7d0d1c] to-[#50040f] rounded-md p-3.5 text-white shadow-lg relative overflow-hidden mb-4">
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

                <button 
                  onClick={() => navigate('/profile')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ffd375] to-[#f5ab2b] text-[#570013] font-bold text-[11px] shadow hover:brightness-105 active:scale-95 transition-all"
                >
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
                  className="w-36 flex-shrink-0 bg-white rounded-md border border-gray-100 p-2 shadow-sm hover:shadow-md transition cursor-pointer relative group"
                >
                  <div className="w-full h-36 rounded-md overflow-hidden relative bg-gray-100 mb-2">
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
                  className="flex flex-col items-center justify-center p-3 bg-white rounded-md border border-gray-100 shadow-sm hover:shadow-md hover:bg-amber-50/40 transition active:scale-95"
                >
                  <div className="relative w-11 h-11 rounded-md bg-gradient-to-b from-amber-50 to-amber-100/60 text-[#6e0b18] flex items-center justify-center mb-1.5">
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
      {!selectedChat && activeTab !== 'MyProfile' && (
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

      {/* Full Modal Overlay Views (Visitors, Saved, Blocked, Help & Support) */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            {/* Modal Header */}
            <div className="bg-[#570013] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300 text-xl">
                  {activeModal === 'Visitors' ? 'group' : activeModal === 'Saved' ? 'bookmark' : activeModal === 'Blocked' ? 'block' : 'support_agent'}
                </span>
                <h3 className="font-extrabold text-sm uppercase tracking-wide font-display">{activeModal}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {activeModal === 'Visitors' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">12 members visited your profile recently:</p>
                  {[
                    { name: 'Riya Garg', time: '10 min ago', city: 'Jaipur', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
                    { name: 'Anjali Bansal', time: '1 hour ago', city: 'Jodhpur', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
                    { name: 'Kavya Goyal', time: 'Yesterday', city: 'Ajmer', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },
                  ].map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <img src={v.image} alt={v.name} className="w-10 h-10 rounded-full object-cover border border-amber-200" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{v.name}</h4>
                          <p className="text-[10px] text-slate-500">{v.city} • {v.time}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setActiveModal(null); navigate('/profile-detail'); }}
                        className="px-3 py-1 bg-[#570013] text-white text-[11px] font-bold rounded-lg hover:bg-[#72001a] active:scale-95 transition"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'Saved' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">Your bookmarked & saved profiles:</p>
                  {[
                    { name: 'Riya Garg', age: 26, city: 'Jaipur', profession: 'Software Engineer', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
                    { name: 'Aman Singhal', age: 29, city: 'Delhi', profession: 'Doctor', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <img src={s.image} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-amber-200" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{s.name}, {s.age}</h4>
                          <p className="text-[10px] text-slate-500">{s.profession} • {s.city}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setActiveModal(null); navigate('/profile-detail'); }}
                        className="px-3 py-1 bg-[#570013] text-white text-[11px] font-bold rounded-lg hover:bg-[#72001a] active:scale-95 transition"
                      >
                        Open Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'Blocked' && (
                <div className="text-center py-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">block</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Blocked Members</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">You have not blocked any profiles yet. Blocked profiles will appear here.</p>
                </div>
              )}

              {activeModal === 'Help & Support' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 space-y-1">
                    <h4 className="font-bold text-[#570013]">Need Assistance?</h4>
                    <p className="text-[11px] text-slate-600">Our Agarwal Samaj Matrimony support team is available 24/7 to help you.</p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <a href="tel:+919876543210" className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-slate-800">
                      <span className="material-symbols-outlined text-emerald-600 text-lg">call</span>
                      <span>Call Support: +91 98765 43210</span>
                    </a>
                    <a href="mailto:support@agarwalbiodata.com" className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-slate-800">
                      <span className="material-symbols-outlined text-blue-600 text-lg">mail</span>
                      <span>Email: support@agarwalbiodata.com</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
