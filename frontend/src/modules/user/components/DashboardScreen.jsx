import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import HeaderBar from './HeaderBar'
import { useActiveProfile } from '../../../context/ActiveProfileContext'
import { avatarSrc, handleAvatarError } from '../../../utils/avatar'
import { getMyProfile } from '../../../services/profileService'
import { getMatches, getTodayMatches, searchMatches, getMatchQuota } from '../../../services/matchService'
import {
  getSavedSearches,
  recordSearch,
  deleteSavedSearch,
  deleteAccount,
} from '../../../services/accountService'
import {
  getReceivedInterests,
  getSentInterests,
  sendInterest,
  acceptInterest,
  declineInterest,
  cancelInterest,
  getInterestStatus,
} from '../../../services/interestService'
import {
  addToShortlist,
  removeFromShortlist,
  getShortlists,
  getVisitors,
  blockUser,
  unblockUser,
  checkBlockStatus,
} from '../../../services/socialService'
import { isAuthenticated, logout } from '../../../services/authService'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../services/notificationService'
import {
  getConversations,
  getMessages,
  markConversationRead,
  openConversation,
  sendMessage as sendMessageApi,
  editMessage as editMessageApi,
  deleteMessage as deleteMessageApi,
  getUnreadMessageCount,
} from '../../../services/messageService'
import {
  onSocketEvent,
  joinConversation,
  leaveConversation,
  sendSocketMessage,
  emitTyping,
  emitConversationRead,
} from '../../../services/socket'
import { resolveAssetUrl } from '../../../services/api'

/** Renders an ISO timestamp as a short relative label ("10 min ago"). */
function relativeTime(value) {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''

  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default function DashboardScreen({ initialTab, onSelectProfile, onBack, isPremiumUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeProfileId } = useActiveProfile()
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
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [newMessageText, setNewMessageText] = useState('')
  const [messageActionsFor, setMessageActionsFor] = useState(null)
  const [messageActionsView, setMessageActionsView] = useState('menu') // 'menu' | 'delete' | 'info'
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState('')
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0)
  const longPressTimerRef = useRef(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const swipeStateRef = useRef({ id: null, startX: 0, startY: 0, pointerId: null, dragging: false })
  const [swipeOffset, setSwipeOffset] = useState({ id: null, x: 0 })
  const SWIPE_REPLY_THRESHOLD = 50
  const [chatMenuOpen, setChatMenuOpen] = useState(false)
  const [chatPartnerBlocked, setChatPartnerBlocked] = useState(false)
  const [chatInterestId, setChatInterestId] = useState(null)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [chatFilterTab, setChatFilterTab] = useState('all') // 'all' | 'unread' | 'verified'
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [favorites, setFavorites] = useState({})
  const [interested, setInterested] = useState({})

  const [activeModal, setActiveModal] = useState(null) // 'Visitors' | 'Saved' | 'Help & Support'
  const [matchQuickFilter, setMatchQuickFilter] = useState('All') // 'All' | 'Verified' | 'HighMatch' | 'Kundali' | 'GovtOrBusiness'
  const [matchSortBy, setMatchSortBy] = useState('compatibility') // 'compatibility' | 'age_asc' | 'age_desc'
  const [notificationsTab, setNotificationsTab] = useState('All')
  const [userProfile, setUserProfile] = useState(null)
  const [liveMatches, setLiveMatches] = useState([])
  const [liveTodayMatches, setLiveTodayMatches] = useState([])
  const [isLoadingLive, setIsLoadingLive] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  // Set when saved partner preferences filtered the feed, so an empty or short
  // list can explain itself instead of looking like "no one is out there".
  const [preferenceFilter, setPreferenceFilter] = useState(null)
  const [matchQuota, setMatchQuota] = useState(null)

  // Contents of the Visitors and Saved modals. Both used to render a
  // hardcoded cast of people who were not members of the platform.
  const [visitorsList, setVisitorsList] = useState([])
  const [savedList, setSavedList] = useState([])
  const [isLoadingModal, setIsLoadingModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return
    setIsDeletingAccount(true)
    setDeleteAccountError('')
    try {
      await deleteAccount()
      await logout()
      localStorage.removeItem('userProfile')
      setShowDeleteAccountModal(false)
      navigate('/welcome', { replace: true })
    } catch (err) {
      setDeleteAccountError(err?.message || 'Failed to delete account. Please try again.')
      setIsDeletingAccount(false)
    }
  }

  useEffect(() => {
    if (activeModal !== 'Visitors' && activeModal !== 'Saved') return
    if (!isAuthenticated()) return

    let cancelled = false
    setIsLoadingModal(true)

    const load = activeModal === 'Visitors'
      ? getVisitors({ limit: 20 }).then((res) =>
          (res?.visitors || []).map((v) => ({
            id: v.id || v._id,
            name: v.visitorProfileId?.fullName || 'A member',
            city: v.visitorProfileId?.city || '',
            time: relativeTime(v.lastVisitedAt || v.createdAt),
            image: resolveAssetUrl(v.visitorProfileId?.profilePicture),
          }))
        )
      : getShortlists({ limit: 20 }).then((res) =>
          (res?.shortlists || []).map((item) => {
            const prof = item.shortlistedProfileId || {}
            return {
              id: item.id || item._id,
              profileId: prof.profileId || prof._id,
              name: prof.fullName || 'A member',
              age: prof.dob
                ? Math.floor((Date.now() - new Date(prof.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
              city: prof.city || '',
              profession: prof.occupation || prof.workingAt || '',
              image: resolveAssetUrl(prof.profilePicture),
            }
          })
        )

    load
      .then((rows) => {
        if (cancelled) return
        if (activeModal === 'Visitors') setVisitorsList(rows)
        else setSavedList(rows)
      })
      .catch(() => {
        if (!cancelled) {
          if (activeModal === 'Visitors') setVisitorsList([])
          else setSavedList([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModal(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeModal, activeProfileId])

  useEffect(() => {
    if (activeTab !== 'Notifications') return
    loadNotifications(notificationsTab)
  }, [activeTab, notificationsTab, activeProfileId])

  const loadNotifications = async (category = 'All') => {
    if (!isAuthenticated()) return

    setIsLoadingNotifications(true)
    try {
      const res = await getNotifications({ category, limit: 50 })
      setNotifications(res?.notifications || [])
      setUnreadNotificationCount(res?.unreadCount || 0)
    } catch {
      setNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    const previous = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadNotificationCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      setNotifications(previous)
    }
  }

  const handleOpenNotification = async (item) => {
    if (item.unread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      )
      setUnreadNotificationCount((c) => Math.max(0, c - 1))
      try {
        await markNotificationRead(item.id)
      } catch {
        // The feed reloads on next open; a failed read flag is not worth a toast.
      }
    }
    if (item.linkTarget) navigate(item.linkTarget)
  }

  useEffect(() => {
    async function loadDashboardData() {
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile))
        } catch {}
      }

      if (isAuthenticated()) {
        try {
          setIsLoadingLive(true)
          setLiveMatches([])
          setLiveTodayMatches([])
          const [profileRes, matchesRes, todayRes, sentInterestsRes, quotaRes, shortlistsRes] = await Promise.allSettled([
            getMyProfile(),
            getMatches({ limit: 20 }),
            getTodayMatches(),
            getSentInterests({ limit: 100 }),
            getMatchQuota(),
            getShortlists({ limit: 100 })
          ])

          if (quotaRes.status === 'fulfilled' && quotaRes.value?.quota) {
            setMatchQuota(quotaRes.value.quota)
          }

          if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
            setUserProfile(profileRes.value.profile)
          }

          if (shortlistsRes.status === 'fulfilled' && shortlistsRes.value?.shortlists) {
            const favMap = {}
            shortlistsRes.value.shortlists.forEach((item) => {
              const prof = item.shortlistedProfileId
              if (prof) {
                if (prof._id) favMap[prof._id] = true
                if (prof.profileId) favMap[prof.profileId] = true
              }
              const rawTarget = item.targetProfileId || item.profileId
              if (rawTarget && typeof rawTarget === 'string') favMap[rawTarget] = true
            })
            setFavorites(favMap)
          }

          if (sentInterestsRes.status === 'fulfilled' && sentInterestsRes.value?.interests) {
            const intMap = {}
            sentInterestsRes.value.interests.forEach((item) => {
              // Only a still-pending interest can be undone here; an accepted
              // match is a real connection, not a mis-tap to reverse.
              if (item.status !== 'Pending') return
              const rec = item.recipientProfileId
              const recId = rec?.profileId || rec?._id || rec
              const interestId = item.id || item._id
              if (recId && interestId) intMap[recId] = interestId
            })
            setInterested(intMap)
          }

          if (matchesRes.status === 'fulfilled' && matchesRes.value?.matches) {
            if (matchesRes.value.preferencesApplied) {
              setPreferenceFilter({
                shown: matchesRes.value.pagination?.total ?? matchesRes.value.matches.length,
                beforeFilter: matchesRes.value.totalBeforePreferences,
              })
            } else {
              setPreferenceFilter(null)
            }

            const formatted = matchesRes.value.matches.map(m => ({
              id: m.profile.profileId || m.profile._id,
              name: m.profile.fullName,
              age: m.profile.dob ? Math.floor((new Date() - new Date(m.profile.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 28,
              height: m.profile.height || "5'10\"",
              city: `${m.profile.city || ''}${m.profile.state ? `, ${m.profile.state}` : ''}`.trim() || 'Indore, Madhya Pradesh',
              profession: m.profile.occupation || m.profile.workingAt || 'Software Engineer',
              education: m.profile.qualification || 'Graduate',
              compatibility: m.matchScore ?? m.totalScore ?? 92,
              gotra: m.profile.gotra,
              motherGotra: m.profile.motherGotra,
              verified: m.profile.verified ?? true,
              isNearby: true,
              maritalStatus: m.profile.maritalStatus || 'Never Married',
              diet: m.profile.dietaryHabits || m.profile.diet || 'Vegetarian',
              image: resolveAssetUrl(m.profile.profilePicture),
              photos: m.profile.photos?.length ? m.profile.photos.map(resolveAssetUrl) : [resolveAssetUrl(m.profile.profilePicture)],
              isActive: true,
            }))
            setLiveMatches(formatted)
          }

          if (todayRes.status === 'fulfilled') {
            const todayRows = todayRes.value?.recommendations || todayRes.value?.todayMatches || []
            const formattedToday = todayRows.map(m => ({
              id: m.profile.profileId || m.profile._id,
              name: m.profile.fullName,
              age: m.profile.dob ? Math.floor((new Date() - new Date(m.profile.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 26,
              height: m.profile.height || "5'5\"",
              city: m.profile.city || 'Delhi',
              matchScore: m.matchScore ?? m.totalScore ?? 0,
              gotra: m.profile.gotra,
              education: m.profile.qualification || 'Graduate',
              image: resolveAssetUrl(m.profile.profilePicture)
            }))
            setLiveTodayMatches(formattedToday)
          }

        } catch (err) {
          console.warn('Dashboard data fetch note:', err)
        } finally {
          setIsLoadingLive(false)
        }
      }
    }

    loadDashboardData()
    refreshUnreadCount()
  }, [activeProfileId])

  useEffect(() => {
    const path = location.pathname
    if (path === '/matches') setActiveTab('Matches')
    else if (path === '/search') setActiveTab('Search')
    else if (path === '/interests') setActiveTab('Interests')
    else if (path === '/chat' || path === '/messages') setActiveTab('Messages')
    else if (path === '/profile') {
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
    // === [IOS-DEPLOY-COMMENT-START] Membership tab handler commented out for iOS deployment ===
    // } else if (tabId === 'Membership') {
    //   navigate('/membership')
    // === [IOS-DEPLOY-COMMENT-END] ===
    } else if (tabId === 'MyProfile') {
      setActiveTab('MyProfile')
    }
  }

  /* ------------------------- Messaging ------------------------- */

  const [chatsList, setChatsList] = useState([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [chatError, setChatError] = useState('')
  const [typingConversationId, setTypingConversationId] = useState(null)
  const typingTimeoutRef = useRef(null)

  /** Maps an API conversation onto the shape this screen renders. */
  const toChatRow = (c) => ({
    id: c.id,
    name: c.withProfile?.fullName || 'Candidate',
    profileId: c.withProfile?.id,
    lastMessage: c.lastMessage || 'Say hello to start the conversation',
    time: relativeTime(c.lastMessageAt),
    unreadCount: c.unreadCount || 0,
    verified: c.withProfile?.verified,
    image: resolveAssetUrl(c.withProfile?.profilePicture),
  })

  const loadConversations = async () => {
    if (!isAuthenticated()) return

    setIsLoadingChats(true)
    setChatError('')
    try {
      const res = await getConversations({ limit: 50 })
      setChatsList((res?.conversations || []).map(toChatRow))
    } catch (err) {
      setChatError(err?.message || 'Could not load your conversations.')
    } finally {
      setIsLoadingChats(false)
    }
  }

  /** Keeps the Messages badge honest - re-fetched on load and on any event that could change it. */
  const refreshUnreadCount = async () => {
    if (!isAuthenticated()) return
    try {
      const res = await getUnreadMessageCount()
      setTotalUnreadMessages(res?.unreadCount || 0)
    } catch {
      // Leave the last known count showing rather than blank it on a transient error.
    }
  }

  useEffect(() => {
    if (activeTab !== 'Messages') return
    setSelectedChat(null)
    loadConversations()
  }, [activeTab, activeProfileId])

  useEffect(() => {
    if (!isAuthenticated()) return

    const offNew = onSocketEvent('message:new', ({ conversationId, message }) => {
      setChatMessages((prev) => {
        if (!prev[conversationId]) return prev
        return { ...prev, [conversationId]: [...prev[conversationId], message] }
      })

      setChatsList((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message.body,
                time: 'Just now',
                unreadCount: selectedChat?.id === conversationId ? 0 : c.unreadCount + 1,
              }
            : c
        )
      )

      // Reading the open thread immediately keeps the badge honest.
      if (selectedChat?.id === conversationId) {
        emitConversationRead(conversationId)
      } else {
        setTotalUnreadMessages((prev) => prev + 1)
      }
    })

    const offTypingStart = onSocketEvent('typing:start', ({ conversationId }) =>
      setTypingConversationId(conversationId)
    )
    const offTypingStop = onSocketEvent('typing:stop', () => setTypingConversationId(null))

    // Sent -> delivered: the recipient came online or opened the thread.
    const offDelivered = onSocketEvent('message:delivered', ({ messageIds, deliveredAt }) => {
      if (!messageIds?.length) return
      setChatMessages((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((convId) => {
          next[convId] = next[convId].map((m) =>
            messageIds.includes(m.id || m._id) ? { ...m, deliveredAt } : m
          )
        })
        return next
      })
    })

    // Delivered -> read: the recipient opened this specific thread.
    const offRead = onSocketEvent('conversation:read', ({ conversationId }) => {
      const now = new Date().toISOString()
      setChatMessages((prev) => {
        if (!prev[conversationId]) return prev
        return {
          ...prev,
          [conversationId]: prev[conversationId].map((m) =>
            m.readAt ? m : { ...m, readAt: now, deliveredAt: m.deliveredAt || now }
          ),
        }
      })
    })

    const offEdited = onSocketEvent('message:edited', ({ conversationId, message }) => {
      setChatMessages((prev) => {
        if (!prev[conversationId]) return prev
        return {
          ...prev,
          [conversationId]: prev[conversationId].map((m) =>
            (m.id || m._id) === (message.id || message._id) ? message : m
          ),
        }
      })
    })

    const offDeleted = onSocketEvent('message:deleted', ({ conversationId, messageId }) => {
      setChatMessages((prev) => {
        if (!prev[conversationId]) return prev
        return {
          ...prev,
          [conversationId]: prev[conversationId].map((m) =>
            (m.id || m._id) === messageId ? { ...m, deletedForEveryone: true, body: '' } : m
          ),
        }
      })
    })

    return () => {
      offNew()
      offTypingStart()
      offTypingStop()
      offDelivered()
      offRead()
      offEdited()
      offDeleted()
    }
  }, [selectedChat])

  /** Opens a thread: joins its socket room, loads history, clears unread. */
  const handleOpenChat = async (chat) => {
    setSelectedChat(chat)
    setChatError('')
    setChatMenuOpen(false)
    setChatPartnerBlocked(false)
    setChatInterestId(null)
    setReplyingTo(null)
    joinConversation(chat.id)

    try {
      const res = await getMessages(chat.id, { limit: 100 })
      setChatMessages((prev) => ({ ...prev, [chat.id]: res?.messages || [] }))

      await markConversationRead(chat.id)
      if (chat.unreadCount > 0) {
        setTotalUnreadMessages((prev) => Math.max(0, prev - chat.unreadCount))
      }
      setChatsList((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
      )
    } catch (err) {
      setChatError(err?.message || 'Could not open this conversation.')
    }

    if (chat.profileId) {
      checkBlockStatus(chat.profileId)
        .then((res) => setChatPartnerBlocked(Boolean(res?.isBlockedByMe)))
        .catch(() => {})
      getInterestStatus(chat.profileId)
        .then((res) => setChatInterestId(res?.interestId || null))
        .catch(() => {})
    }
  }

  const handleCloseChat = () => {
    if (selectedChat) leaveConversation(selectedChat.id)
    setSelectedChat(null)
    setChatMenuOpen(false)
    setReplyingTo(null)
  }

  /** Withdraws the interest connecting this thread - ends the match. */
  const handleUndoInterestFromChat = async () => {
    if (!selectedChat || !chatInterestId) return
    setChatMenuOpen(false)

    try {
      await cancelInterest(chatInterestId)
      showToast('Interest withdrawn. This match has ended.', 'info')
      setChatsList((prev) => prev.filter((c) => c.id !== selectedChat.id))
      handleCloseChat()
    } catch (err) {
      showToast(err?.message || 'Could not withdraw interest. Please try again.', 'error')
    }
  }

  /** Blocks or unblocks the person on the other end of this thread. */
  const handleToggleBlockFromChat = async () => {
    if (!selectedChat?.profileId) return
    setChatMenuOpen(false)
    const wasBlocked = chatPartnerBlocked

    try {
      if (wasBlocked) {
        await unblockUser(selectedChat.profileId)
        setChatPartnerBlocked(false)
        showToast('Profile unblocked.', 'success')
      } else {
        await blockUser(selectedChat.profileId)
        setChatPartnerBlocked(true)
        showToast('Profile blocked. This conversation is now closed.', 'info')
        setChatsList((prev) => prev.filter((c) => c.id !== selectedChat.id))
        handleCloseChat()
      }
    } catch (err) {
      showToast(err?.message || 'Could not update block status. Please try again.', 'error')
    }
  }

  const handleSendMessage = async (chatId) => {
    const text = newMessageText.trim()
    if (!text) return

    const replyToMessageId = replyingTo ? replyingTo.id || replyingTo._id : undefined

    setNewMessageText('')
    setReplyingTo(null)
    emitTyping(chatId, false)

    try {
      // Prefer the socket for latency; fall back to REST when it is down.
      let saved
      try {
        saved = await sendSocketMessage(chatId, text, replyToMessageId)
      } catch {
        const res = await sendMessageApi(chatId, text, replyToMessageId)
        saved = res?.message
      }

      if (saved) {
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), saved],
        }))
        setChatsList((prev) =>
          prev.map((c) =>
            c.id === chatId ? { ...c, lastMessage: text, time: 'Just now', unreadCount: 0 } : c
          )
        )
      }
    } catch (err) {
      setNewMessageText(text)
      setReplyingTo(replyToMessageId ? replyingTo : null)
      setChatError(err?.message || 'Message could not be sent.')
    }
  }

  /** A sent message can only be edited within this window (mirrors the backend). */
  const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000

  const isMyMessage = (msg) =>
    selectedChat && String(msg.recipientProfileId) === String(selectedChat.profileId)

  const canEditMessage = (msg) =>
    isMyMessage(msg) &&
    !msg.deletedForEveryone &&
    Date.now() - new Date(msg.createdAt).getTime() < MESSAGE_EDIT_WINDOW_MS

  const openMessageActions = (msg) => {
    if (msg.deletedForEveryone) return
    setMessageActionsFor(msg)
    setMessageActionsView('menu')
  }
  const closeMessageActions = () => {
    setMessageActionsFor(null)
    setMessageActionsView('menu')
  }

  const handleLongPressStart = (msg) => {
    longPressTimerRef.current = setTimeout(() => openMessageActions(msg), 450)
  }
  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  /**
   * Swipe-right-to-reply, WhatsApp-style. Starts alongside the long-press
   * timer; the moment horizontal movement is detected it cancels the
   * long-press (this is a drag, not a hold) and tracks the bubble offset.
   */
  const handleMessagePointerDown = (msg, e) => {
    if (msg.deletedForEveryone) return
    const msgId = msg.id || msg._id
    swipeStateRef.current = {
      id: msgId,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      dragging: false,
    }
    // Without capture, once a touch moves off its start point some mobile
    // browsers stop routing move/up events to this element - the gesture
    // just silently dies. Capturing keeps every event for this touch here
    // regardless of where the finger physically is.
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Unsupported in this browser - the gesture still works, just less robustly.
    }
    handleLongPressStart(msg)
  }

  const handleMessagePointerMove = (msg, e) => {
    const msgId = msg.id || msg._id
    const state = swipeStateRef.current
    if (state.id !== msgId) return

    const deltaX = e.clientX - state.startX
    const deltaY = e.clientY - state.startY

    if (!state.dragging) {
      // Only commit to a horizontal swipe once movement is clearly more
      // sideways than vertical - otherwise this is a normal thread scroll.
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        state.dragging = true
        handleLongPressEnd()
      } else if (Math.abs(deltaY) > 8) {
        // Clearly scrolling - stop tracking this touch as a swipe candidate.
        swipeStateRef.current = { id: null, startX: 0, startY: 0, pointerId: null, dragging: false }
        return
      }
    }

    if (state.dragging) {
      e.preventDefault()
      const clamped = Math.max(0, Math.min(deltaX, 70))
      setSwipeOffset({ id: msgId, x: clamped })
    }
  }

  const handleMessagePointerUp = (msg, e) => {
    handleLongPressEnd()
    const msgId = msg.id || msg._id
    const state = swipeStateRef.current
    if (e?.currentTarget && state.pointerId != null) {
      try {
        e.currentTarget.releasePointerCapture(state.pointerId)
      } catch {
        // Already released or unsupported - nothing to clean up.
      }
    }
    if (state.id === msgId && state.dragging && swipeOffset.id === msgId && swipeOffset.x >= SWIPE_REPLY_THRESHOLD) {
      setReplyingTo(msg)
    }
    swipeStateRef.current = { id: null, startX: 0, startY: 0, pointerId: null, dragging: false }
    setSwipeOffset({ id: null, x: 0 })
  }

  const startEditMessage = (msg) => {
    setEditingMessage(msg)
    setEditText(msg.body)
    closeMessageActions()
  }
  const cancelEditMessage = () => {
    setEditingMessage(null)
    setEditText('')
  }

  const saveEditMessage = async () => {
    const text = editText.trim()
    if (!text || !editingMessage || !selectedChat) return
    const msgId = editingMessage.id || editingMessage._id

    try {
      const res = await editMessageApi(msgId, text)
      const updated = res?.message
      if (updated) {
        setChatMessages((prev) => ({
          ...prev,
          [selectedChat.id]: (prev[selectedChat.id] || []).map((m) =>
            (m.id || m._id) === msgId ? updated : m
          ),
        }))
      }
      cancelEditMessage()
    } catch (err) {
      showToast(err?.message || 'Could not edit message.', 'error')
    }
  }

  const handleDeleteMessage = async (scope) => {
    if (!messageActionsFor || !selectedChat) return
    const msgId = messageActionsFor.id || messageActionsFor._id
    const convId = selectedChat.id

    try {
      await deleteMessageApi(msgId, scope)
      setChatMessages((prev) => ({
        ...prev,
        [convId]:
          scope === 'everyone'
            ? (prev[convId] || []).map((m) =>
                (m.id || m._id) === msgId ? { ...m, deletedForEveryone: true, body: '' } : m
              )
            : (prev[convId] || []).filter((m) => (m.id || m._id) !== msgId),
      }))
      showToast(scope === 'everyone' ? 'Message deleted for everyone.' : 'Message deleted.', 'info')
    } catch (err) {
      showToast(err?.message || 'Could not delete message.', 'error')
    } finally {
      closeMessageActions()
    }
  }

  const formatFullTime = (date) =>
    date ? new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : null

  /** Debounced typing indicator: start on input, stop after a idle second. */
  const handleMessageInputChange = (value, chatId) => {
    setNewMessageText(value)
    if (!chatId) return

    emitTyping(chatId, true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => emitTyping(chatId, false), 1200)
  }

  const toggleFavorite = async (profileId, e) => {
    e?.stopPropagation()
    if (!profileId) return
    const isFav = !!favorites[profileId]
    setFavorites(prev => ({ ...prev, [profileId]: !isFav }))
    try {
      if (isFav) {
        await removeFromShortlist(profileId)
        showToast('Removed from shortlist', 'info')
      } else {
        await addToShortlist(profileId)
        showToast('Added to shortlist', 'success')
      }
    } catch (err) {
      setFavorites(prev => ({ ...prev, [profileId]: isFav }))
      showToast(err?.message || 'Could not update shortlist', 'info')
    }
  }

  const toggleInterest = async (profileId, e) => {
    e?.stopPropagation()
    if (!profileId) return

    const existingInterestId = interested[profileId]

    // Already sent - a second tap undoes it, for a mis-tap or change of mind.
    if (existingInterestId) {
      setInterested((prev) => {
        const next = { ...prev }
        delete next[profileId]
        return next
      })
      try {
        await cancelInterest(existingInterestId)
        showToast('Interest withdrawn.', 'info')
      } catch (err) {
        // Restore on failure so the UI matches what actually happened server-side.
        setInterested((prev) => ({ ...prev, [profileId]: existingInterestId }))
        showToast(err?.message || 'Could not withdraw interest. Please try again.', 'info')
      }
      return
    }

    try {
      const res = await sendInterest(profileId, 'Hello, I liked your profile and would like to connect.')
      const newInterestId = res?.interest?.id || res?.interest?._id
      if (newInterestId) {
        setInterested((prev) => ({ ...prev, [profileId]: newInterestId }))
      }
      showToast('Interest expressed successfully!', 'success')
    } catch (err) {
      showToast(err?.message || 'Interest already expressed', 'info')
    }
  }

  /* ------------------------- Interests ------------------------- */

  const [interestsData, setInterestsData] = useState([])

  /** Maps an API interest onto the row shape this screen renders. */
  const toInterestRow = (int, direction) => {
    const other = direction === 'Sent' ? int.recipientProfileId : int.senderProfileId
    const statusLabel =
      int.status === 'Pending' ? direction : int.status === 'Accepted' ? 'Accepted' : int.status

    return {
      id: int.id || int._id,
      name: other?.fullName || 'Candidate',
      profileId: other?._id || other,
      age: other?.dob
        ? Math.floor((Date.now() - new Date(other.dob)) / (365.25 * 24 * 60 * 60 * 1000))
        : null,
      city: other?.city || '',
      date: new Date(int.createdAt).toLocaleDateString(),
      status: statusLabel,
      direction,
      image: resolveAssetUrl(other?.profilePicture),
    }
  }

  const loadInterests = async () => {
    if (!isAuthenticated()) return

    try {
      const [received, sent] = await Promise.all([
        getReceivedInterests({ limit: 100 }),
        getSentInterests({ limit: 100 }),
      ])

      setInterestsData([
        ...(received?.interests || []).map((i) => toInterestRow(i, 'Received')),
        ...(sent?.interests || []).map((i) => toInterestRow(i, 'Sent')),
      ])
    } catch {
      // The Interests tab renders its own empty state.
    }
  }

  useEffect(() => {
    if (activeTab !== 'Interests') return
    loadInterests()
  }, [activeTab, activeProfileId])

  /**
   * Accept or decline a received interest. Accepting also opens the
   * conversation so the user can message straight away.
   */
  const handleUpdateInterestStatus = async (id, newStatus, e) => {
    e?.stopPropagation()

    const previous = interestsData
    setInterestsData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )

    try {
      if (newStatus === 'Accepted') {
        await acceptInterest(id)
        showToast('Interest accepted. You can now start a conversation.', 'success')
        loadConversations()
      } else if (newStatus === 'Declined') {
        await declineInterest(id)
        showToast('Interest declined.', 'success')
      } else if (newStatus === 'Cancelled') {
        await cancelInterest(id)
        showToast('Interest withdrawn.', 'info')
        // Keep the Matches tab's Interested button in sync with the withdrawal.
        const cancelled = previous.find((item) => item.id === id)
        if (cancelled?.profileId) {
          setInterested((prev) => {
            const next = { ...prev }
            delete next[cancelled.profileId]
            return next
          })
        }
      }
    } catch (err) {
      setInterestsData(previous)
      showToast(err?.message || 'Could not update this interest.', 'error')
    }
  }

  /** Opens (creating if needed) the chat thread with a connected candidate. */
  const handleMessageCandidate = async (profileId, e) => {
    e?.stopPropagation()
    if (!profileId) return

    try {
      const res = await openConversation(profileId)
      const conversation = res?.conversation
      if (!conversation) throw new Error('Conversation could not be opened.')

      await loadConversations()
      handleTabNavigate('Messages')
      await handleOpenChat(toChatRow(conversation))
    } catch (err) {
      showToast(err?.message || 'Could not open this conversation.', 'error')
    }
  }

  /* -------------------------- Search --------------------------- */

  const [recentSearches, setRecentSearches] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const loadRecentSearches = async () => {
    if (!isAuthenticated()) return
    try {
      const res = await getSavedSearches({ limit: 10 })
      setRecentSearches(
        (res?.searches || []).map((s) => ({
          id: s.id,
          title: s.label || s.query,
          subtitle: s.resultCount ? `${s.resultCount} results` : 'Tap to run again',
          query: s.query,
        }))
      )
    } catch {
      setRecentSearches([])
    }
  }

  useEffect(() => {
    if (activeTab !== 'Search') return
    loadRecentSearches()
  }, [activeTab, activeProfileId])

  /** Runs a server-side search and records it in the user's history. */
  const runSearch = async (term) => {
    const q = (term ?? searchQuery).trim()
    if (!q) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await searchMatches({ query: q, limit: 50 })
      const results = (res?.results || res?.matches || []).map((r) => {
        const prof = r.profile || r
        return {
          id: prof.profileId || prof._id,
          name: prof.fullName,
          age: prof.dob
            ? Math.floor((Date.now() - new Date(prof.dob)) / (365.25 * 24 * 60 * 60 * 1000))
            : null,
          height: prof.height || '',
          city: [prof.city, prof.state].filter(Boolean).join(', '),
          profession: prof.occupation || prof.workingAt || '',
          education: prof.qualification || '',
          compatibility: r.matchScore || prof.matchScore || 0,
          gotra: prof.gotra,
          verified: prof.verified,
          image: resolveAssetUrl(prof.profilePicture),
        }
      })

      setSearchResults(results)

      if (isAuthenticated()) {
        await recordSearch({ query: q, label: q, resultCount: results.length })
        loadRecentSearches()
      }
    } catch (err) {
      showToast(err?.message || 'Search failed. Please try again.', 'error')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const removeRecentSearch = async (id, e) => {
    e?.stopPropagation()
    setRecentSearches((prev) => prev.filter((item) => item.id !== id))
    try {
      await deleteSavedSearch(id)
    } catch {
      loadRecentSearches()
    }
  }

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

  const fallbackMatches = [
    {
      id: 'saurabh-mehrotra-indore',
      profileId: 'saurabh-mehrotra-indore',
      name: 'Saurabh Mehrotra',
      age: 31,
      height: "5'10\"",
      city: 'Indore, Madhya Pradesh',
      profession: 'Software Engineer',
      education: 'B.Tech - Computer Science',
      compatibility: 92,
      matchScore: 92,
      gotra: 'Garg',
      motherGotra: 'Goyal',
      verified: true,
      isNearby: true,
      maritalStatus: 'Never Married',
      diet: 'Vegetarian',
      image: '/assets/saurabh-match.jpg',
      photos: ['/assets/saurabh-match.jpg'],
      isActive: true,
    },
    {
      id: 'rahul-garg-delhi',
      profileId: 'rahul-garg-delhi',
      name: 'Rahul Garg',
      age: 29,
      height: "5'11\"",
      city: 'Delhi, NCR',
      profession: 'Software Architect',
      education: 'M.Tech',
      compatibility: 89,
      matchScore: 89,
      gotra: 'Garg',
      motherGotra: 'Bansal',
      verified: true,
      isNearby: true,
      maritalStatus: 'Never Married',
      diet: 'Vegetarian',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      isActive: true,
    },
    {
      id: 'vikram-singhal-indore',
      profileId: 'vikram-singhal-indore',
      name: 'Vikram Singhal',
      age: 32,
      height: "6'0\"",
      city: 'Indore, Madhya Pradesh',
      profession: 'Tech Entrepreneur / CTO',
      education: 'MBA & B.Tech',
      compatibility: 86,
      matchScore: 86,
      gotra: 'Singhal',
      motherGotra: 'Mittal',
      verified: true,
      isNearby: true,
      maritalStatus: 'Never Married',
      diet: 'Vegetarian',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
      isActive: true,
    },
    {
      id: 'dr-sneha-mittal-chd',
      profileId: 'dr-sneha-mittal-chd',
      name: 'Dr. Sneha Mittal',
      age: 28,
      height: "5'6\"",
      city: 'Chandigarh, Punjab',
      profession: 'Consultant Dermatologist',
      education: 'MBBS, MD',
      compatibility: 91,
      matchScore: 91,
      gotra: 'Mittal',
      motherGotra: 'Jindal',
      verified: true,
      isNearby: false,
      maritalStatus: 'Never Married',
      diet: 'Vegetarian',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
      isActive: true,
    }
  ]

  const matchesList = liveMatches.length > 0
    ? (liveMatches.some(m => m.name?.toLowerCase().includes('saurabh')) ? liveMatches : [fallbackMatches[0], ...liveMatches])
    : fallbackMatches
  const todayMatches = liveTodayMatches

  // Server-side results once a search has run; otherwise the match feed is
  // reused so the tab has something to show before the user types.
  const filteredSearchList = searchQuery.trim()
    ? searchResults
    : matchesList

  // Filtered interests by tab. "Received"/"Sent" mean pending in that
  // direction; "Accepted"/"Declined" span both directions.
  const filteredInterests = interestsData.filter((item) => item.status === interestsTab)

  // Live notification feed. `notificationsList` mirrors the shape the render
  // below already expects, so only the source changed.
  const notificationsList = notifications.map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    subtitle: n.body || '',
    time: relativeTime(n.createdAt),
    unread: !n.isRead,
    isProgressRing: !n.actorProfileId?.profilePicture,
    image: resolveAssetUrl(n.actorProfileId?.profilePicture),
    linkTarget: n.linkTarget,
  }))

  // Shared nav item config, driving both the mobile bottom bar and the
  // desktop sidebar so the tab list/badge/active logic only lives once.
  const navTabs = [
    { id: 'Home', label: 'Home', icon: 'home' },
    { id: 'Matches', label: 'Matches', icon: 'favorite' },
    {
      id: 'Messages',
      label: 'Messages',
      icon: 'chat',
      badge: totalUnreadMessages > 0 ? String(totalUnreadMessages) : undefined,
    },
    { id: 'Interests', label: 'Interests', icon: 'diversity_1' },
    { id: 'Profile', label: 'Profile', icon: 'person' },
  ]

  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      {/* Desktop Sidebar Navigation (replaces the bottom bar at lg:+) */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:h-screen lg:border-r lg:border-gray-200/80 lg:bg-white lg:py-6 lg:px-3">
        <div className="px-3 pb-6">
          <span className="font-display font-extrabold text-lg text-[#570013]">Agrawal Biodata</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id || (activeTab === 'Notifications' && tab.id === 'Home')
            return (
              <button
                key={tab.id}
                onClick={() => handleTabNavigate(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-semibold text-sm transition ${
                  isActive ? 'bg-amber-50 text-[#6e0b18]' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="flex-1">{tab.label}</span>
                {tab.badge && (
                  <span className="w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

    <div className="bg-[#fcfaf7] text-slate-800 font-body min-h-screen flex flex-col justify-between pb-24 select-none lg:flex-1 lg:h-screen lg:overflow-y-auto lg:pb-0">
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
            {isLoadingNotifications && notificationsList.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-400 font-semibold">
                Loading notifications...
              </div>
            )}

            {!isLoadingNotifications && notificationsList.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl block mb-2">notifications_off</span>
                <p className="text-xs font-semibold">You have no notifications yet.</p>
              </div>
            )}

            {notificationsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenNotification(item)}
                  className="flex items-center justify-between py-2 border-b border-gray-100/90 gap-3 cursor-pointer hover:bg-amber-50/40 transition-colors -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.isProgressRing ? (
                      <div className="relative w-12 h-12 rounded-full border-2 border-amber-300 bg-amber-50 text-[#570013] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <span className="material-symbols-outlined text-xl">account_circle</span>
                      </div>
                    ) : (
                      <img
                        src={avatarSrc(item.image)} onError={handleAvatarError}
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

          {/* Mark All Read */}
          {unreadNotificationCount > 0 && (
            <div className="text-center py-3">
              <button
                onClick={handleMarkAllNotificationsRead}
                className="text-xs font-bold text-[#570013] hover:underline cursor-pointer"
              >
                Mark all {unreadNotificationCount} as read
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'Profile' ? (
        /* PROFILE PAGE VIEW (Design Reference Layout) */
        <div className="pb-12 max-w-2xl mx-auto w-full px-1 sm:px-2">
          {/* Page header: replaces the global app header on this page */}
          <div className="sticky top-0 z-30 -mx-1 sm:-mx-2 px-4 py-3 flex items-center gap-2 bg-[#fbf9f5] border-b-2 border-[#c69a3d]">
            <button
              onClick={() => navigate('/home')}
              className="p-1 rounded-full hover:bg-amber-100/60 active:scale-95 transition text-[#570013] -ml-1"
              aria-label="Back to Home"
            >
              <span className="material-symbols-outlined text-2xl block">arrow_back</span>
            </button>
            <h1 className="text-lg font-display font-extrabold text-[#570013]">My Profile</h1>
          </div>
          {/* Top Dark Header Card */}
          <div className="bg-[#181d2d] rounded-3xl p-4 sm:p-5 mx-3 sm:mx-4 mt-3 mb-5 shadow-xl border border-slate-800/80 text-white relative overflow-hidden">
            {/* Subtle glow / gradient highlight in the background */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#570013]/30 rounded-full blur-2xl pointer-events-none" />

            {/* Profile Avatar + Info + Help button */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar with Online/Verified Indicator */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-400 via-indigo-400 to-amber-300 shadow-md overflow-hidden bg-slate-800">
                    {userProfile?.profilePicture ? (
                      <img
                        src={avatarSrc(userProfile.profilePicture)}
                        onError={handleAvatarError}
                        alt={userProfile?.fullName || 'User Profile'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-3xl">person</span>
                      </div>
                    )}
                  </div>
                  {/* Status dot */}
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#181d2d] rounded-full shadow-xs" />
                </div>

                {/* Name, Mobile/ID, and Badges */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                    <span>{userProfile?.fullName || 'Meera Dharan'}</span>
                    {userProfile?.verified && (
                      <span
                        className="material-symbols-outlined text-amber-300 text-[16px] shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        title="Verified Member"
                      >
                        verified
                      </span>
                    )}
                  </h1>

                  <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                    {userProfile?.mobileNumber || userProfile?.mobile || '+91 7777777777'}
                  </p>

                  {/* Pills Row (Rating / Score & Member / Gotra) */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-amber-300 text-[11px] font-bold shadow-2xs">
                      <span>★</span>
                      <span>5</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-200 text-[11px] font-medium shadow-2xs">
                      <span className="material-symbols-outlined text-[13px] text-amber-300">workspace_premium</span>
                      <span>{userProfile?.subscriptionPlan ? `${userProfile.subscriptionPlan} Member` : `${userProfile?.gotra || 'Agarwal'} Gotra`}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Help Button */}
              <button
                type="button"
                onClick={() => navigate('/help-support')}
                className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">headset_mic</span>
                <span>Help</span>
              </button>
            </div>

            {/* Inner Sub-Card with 3 Stats Columns */}
            {(() => {
              const completionPct = Number(userProfile?.completionPercentage ?? 75);
              return (
                <div className="mt-4 bg-[#21273d]/80 border border-white/10 rounded-2xl p-3 grid grid-cols-3 divide-x divide-white/10 text-center shadow-inner">
                  {/* Column 1: Completion */}
                  <div className="px-2">
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-sky-400">track_changes</span>
                      <span>Completion</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-1">
                      {completionPct}%
                    </div>
                  </div>

                  {/* Column 2: Visitors */}
                  <div className="px-2">
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-indigo-400">visibility</span>
                      <span>Visitors</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-1">
                      {visitorsList?.length || 0}
                    </div>
                  </div>

                  {/* Column 3: Rating / Plan */}
                  <div className="px-2">
                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-amber-400">star</span>
                      <span>Rating</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-1 flex items-center justify-center gap-0.5">
                      <span>5</span>
                      <span className="text-amber-400 text-xs">★</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 1: YOUR ACCOUNT */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 px-4 mb-2 text-xs font-extrabold text-slate-500 tracking-wider uppercase font-display">
              <span className="material-symbols-outlined text-[16px]">account_box</span>
              <span>Your Account</span>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs mx-3 sm:mx-4 overflow-hidden divide-y divide-slate-100">
              {/* Personal Information */}
              <button
                type="button"
                onClick={() => navigate('/profile-completion-dashboard')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">person</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Personal Information</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {userProfile?.mobileNumber || userProfile?.email || '+91 7777777777'}
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* My Full Biodata */}
              <button
                type="button"
                onClick={() => handleTabNavigate('MyProfile')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">My Full Biodata</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      View matrimonial biodata, gotra & family details
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* Partner Preferences */}
              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">tune</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Partner Preferences</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      Age, gotra, city, education & occupation criteria
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* Documents & Verification */}
              <button
                type="button"
                onClick={() => navigate('/verification')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Documents & KYC</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {userProfile?.verified ? 'KYC Verified Member' : 'Upload ID & get verified badge'}
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* === [IOS-DEPLOY-COMMENT-START] Membership Plan row (Membership / Wallet) commented out for iOS deployment ===
              <button
                type="button"
                onClick={() => navigate('/membership')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Membership Plan</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {userProfile?.subscriptionPlan || 'Free'} Plan • Direct contact unlocks
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>
              === [IOS-DEPLOY-COMMENT-END] === */}
            </div>
          </div>

          {/* Section 2: BENEFITS & ACTIVITY */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 px-4 mb-2 text-xs font-extrabold text-slate-500 tracking-wider uppercase font-display">
              <span className="material-symbols-outlined text-[16px]">card_giftcard</span>
              <span>Benefits & Activity</span>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs mx-3 sm:mx-4 overflow-hidden divide-y divide-slate-100">
              {/* Interests & Requests */}
              <button
                type="button"
                onClick={() => handleTabNavigate('Interests')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Interests & Requests</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      Manage incoming and sent expressions of interest
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* Profile Visitors */}
              <button
                type="button"
                onClick={() => setActiveModal('Visitors')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">visibility</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Profile Visitors</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      See who viewed your biodata recently
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* Saved Profiles */}
              <button
                type="button"
                onClick={() => setActiveModal('Saved')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">bookmark</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Saved Profiles</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      View bookmarked candidate profiles
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: SETTINGS & PRIVACY */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 px-4 mb-2 text-xs font-extrabold text-slate-500 tracking-wider uppercase font-display">
              <span className="material-symbols-outlined text-[16px]">security</span>
              <span>Settings & Privacy</span>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs mx-3 sm:mx-4 overflow-hidden divide-y divide-slate-100">
              {/* Account Settings */}
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Account & Privacy Settings</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      Phone visibility, notifications & deactivation
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* Blocked Profiles */}
              <button
                type="button"
                onClick={() => navigate('/blocked')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">block</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Blocked Profiles</h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      Manage blocked or restricted members
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  localStorage.removeItem('userProfile')
                  navigate('/welcome', { replace: true })
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50/40 active:bg-rose-100/40 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">logout</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-rose-800 tracking-tight">Log Out</h3>
                    <p className="text-xs text-rose-400 font-medium truncate mt-0.5">
                      Sign out of your active account session
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-rose-100/70 flex items-center justify-center text-rose-600 group-hover:bg-rose-200/80 transition shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </button>
            </div>
          </div>

          {/* Delete Account Link */}
          <div className="text-center pb-4">
            <button
              type="button"
              onClick={() => {
                setShowDeleteAccountModal(true)
                setDeleteConfirmText('')
                setDeleteAccountError('')
              }}
              className="text-xs text-red-500 hover:text-red-700 font-semibold transition active:scale-95 cursor-pointer py-1 px-3 rounded-md hover:bg-red-50/50"
            >
              Delete Account Permanently
            </button>
          </div>
        </div>
      ) : activeTab === 'Messages' ? (
        /* MESSAGES / CHATS PAGE VIEW - list + thread mount simultaneously at
           lg:+ as a WhatsApp-Web-style split pane; below lg: exactly one of
           them is visible at a time, same as before. */
        <div className="lg:flex lg:h-screen lg:overflow-hidden">
        {selectedChat && (
          /* CONVERSATION THREAD VIEW */
          <div className="fixed inset-0 lg:static lg:flex-1 lg:order-2 w-full max-w-[480px] lg:max-w-none mx-auto lg:mx-0 bg-[#fff8ee] z-50 lg:z-auto flex flex-col overflow-hidden">
            {/* Thread Header (Fixed Top) */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200/70 px-4 py-3 flex items-center justify-between z-30 shadow-2xs relative">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={handleCloseChat}
                  className="p-1 rounded-full hover:bg-gray-100 transition text-slate-800 flex-shrink-0"
                  aria-label="Back to chats"
                >
                  <span className="material-symbols-outlined text-2xl block">arrow_back</span>
                </button>
                <button
                  onClick={() =>
                    selectedChat.profileId &&
                    onSelectProfile &&
                    onSelectProfile({ id: selectedChat.profileId, name: selectedChat.name, image: selectedChat.image })
                  }
                  className="flex items-center gap-2.5 min-w-0 text-left"
                >
                  <div className="relative w-9 h-9 rounded-full flex-shrink-0 bg-amber-50 flex items-center justify-center overflow-hidden">
                    {selectedChat.image ? (
                      <img
                        src={avatarSrc(selectedChat.image)} onError={handleAvatarError}
                        alt={selectedChat.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-lg text-[#570013]">person</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-xs md:text-sm text-slate-900 leading-tight truncate">
                      {selectedChat.name}
                    </h2>
                    {typingConversationId === selectedChat.id && (
                      <p className="text-[10px] text-emerald-600 font-semibold">Typing...</p>
                    )}
                  </div>
                </button>
              </div>

              {/* Thread Options Menu */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setChatMenuOpen((v) => !v)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition text-slate-800"
                  aria-label="Chat options"
                >
                  <span className="material-symbols-outlined text-xl block">more_vert</span>
                </button>

                {chatMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setChatMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-md border border-gray-200 shadow-lg z-50 overflow-hidden">
                      {chatInterestId && (
                        <button
                          onClick={handleUndoInterestFromChat}
                          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-amber-50 transition text-left"
                        >
                          <span className="material-symbols-outlined text-base">undo</span>
                          Undo Interest
                        </button>
                      )}
                      <button
                        onClick={handleToggleBlockFromChat}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <span className="material-symbols-outlined text-base">block</span>
                        {chatPartnerBlocked ? 'Unblock Profile' : 'Block Profile'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {chatPartnerBlocked && (
              <div className="flex-shrink-0 px-4 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 font-bold text-center">
                You have blocked this profile.
              </div>
            )}

            {chatError && (
              <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-b border-red-200 text-[11px] text-red-800 font-bold flex items-center justify-between">
                <span>{chatError}</span>
                <button onClick={() => setChatError('')} className="text-red-500 font-bold">
                  ✕
                </button>
              </div>
            )}

            {/* Messages Thread Body (Only Messages Scrollable) */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3 bg-[#fff8ee]">
              {/* Date Tag Pill */}
              <div className="flex justify-center my-2">
                <span className="px-3.5 py-1 bg-white border border-amber-100 text-slate-600 text-[11px] font-bold rounded-full shadow-2xs">
                  Today
                </span>
              </div>

              {(chatMessages[selectedChat.id] || []).length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-semibold">
                  No messages yet. Say hello to start the conversation.
                </div>
              )}

              {(chatMessages[selectedChat.id] || []).map((msg) => {
                // The thread is rendered from the recipient's point of view:
                // a message is "mine" when I am not its recipient.
                const isMine = String(msg.recipientProfileId) === String(selectedChat.profileId)
                const msgId = msg.id || msg._id
                const isEditingThis = (editingMessage?.id || editingMessage?._id) === msgId
                const isDeleted = msg.deletedForEveryone

                const isSwipingThis = swipeOffset.id === msgId

                return (
                  <div key={msgId} className="relative w-full">
                    {isSwipingThis && swipeOffset.x > 0 && (
                      <span
                        className="absolute left-1 top-1/2 -translate-y-1/2 text-[#570013] material-symbols-outlined text-lg"
                        style={{ opacity: Math.min(swipeOffset.x / SWIPE_REPLY_THRESHOLD, 1) }}
                      >
                        reply
                      </span>
                    )}
                    <div
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      style={{
                        transform: isSwipingThis ? `translateX(${swipeOffset.x}px)` : undefined,
                        transition: isSwipingThis ? 'none' : 'transform 0.15s ease',
                      }}
                    >
                    <div
                      onPointerDown={(e) => !isDeleted && !isEditingThis && handleMessagePointerDown(msg, e)}
                      onPointerMove={(e) => handleMessagePointerMove(msg, e)}
                      onPointerUp={(e) => handleMessagePointerUp(msg, e)}
                      onPointerLeave={handleLongPressEnd}
                      onPointerCancel={(e) => handleMessagePointerUp(msg, e)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        if (!isDeleted && !isEditingThis) openMessageActions(msg)
                      }}
                      style={{ touchAction: 'pan-y' }}
                      className={`max-w-[80%] px-3.5 py-2 rounded-md text-xs leading-normal shadow-2xs select-none ${
                        isEditingThis ? 'w-full' : 'flex flex-wrap items-end gap-2'
                      } ${
                        isMine
                          ? 'bg-[#ffe6c9] text-slate-900 rounded-tr-none'
                          : 'bg-white border border-amber-100/70 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {!isEditingThis && msg.replyTo && (
                        <div
                          className={`w-full mb-1 px-2 py-1 rounded border-l-2 text-[10px] ${
                            isMine ? 'bg-black/5 border-[#570013]' : 'bg-amber-50 border-amber-400'
                          }`}
                        >
                          <p className="font-bold text-[#570013] truncate">
                            {String(msg.replyTo.senderProfileId) === String(selectedChat.profileId)
                              ? selectedChat.name
                              : 'You'}
                          </p>
                          <p className="text-slate-500 truncate">{msg.replyTo.body || 'This message was deleted'}</p>
                        </div>
                      )}
                      {isEditingThis ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditMessage()}
                            className="text-xs font-medium text-slate-900 bg-white rounded-md px-2 py-1.5 border border-amber-300 focus:outline-none focus:border-[#570013]"
                          />
                          <div className="flex items-center gap-3 justify-end">
                            <button onClick={cancelEditMessage} className="text-[10px] font-bold text-slate-500">
                              Cancel
                            </button>
                            <button onClick={saveEditMessage} className="text-[10px] font-bold text-[#570013]">
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className={isDeleted ? 'italic text-slate-400' : ''}>
                            {isDeleted ? 'This message was deleted' : msg.body}
                          </span>
                          <div className="flex items-center gap-1 ml-auto pt-1 text-[10px] text-slate-400">
                            {msg.editedAt && !isDeleted && <span className="italic">edited</span>}
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMine && !isDeleted && (
                              <span
                                className={`material-symbols-outlined text-sm leading-none ${
                                  msg.readAt ? 'text-sky-500' : 'text-slate-400'
                                }`}
                              >
                                {msg.deliveredAt || msg.readAt ? 'done_all' : 'done'}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Message Actions Bottom Sheet (long-press or right-click a message) */}
            {messageActionsFor && (
              <div
                className="fixed inset-0 z-[110] bg-black/50 flex items-end justify-center animate-fade-in"
                onClick={closeMessageActions}
              >
                <div
                  className="bg-white w-full max-w-[480px] rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  {messageActionsView === 'menu' && (
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-slate-500 line-clamp-2">{messageActionsFor.body}</p>
                      </div>
                      {canEditMessage(messageActionsFor) && (
                        <button
                          onClick={() => startEditMessage(messageActionsFor)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50 text-left"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Edit Message
                        </button>
                      )}
                      <button
                        onClick={() => setMessageActionsView('delete')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Delete Message
                      </button>
                      {isMyMessage(messageActionsFor) && (
                        <button
                          onClick={() => setMessageActionsView('info')}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50 text-left"
                        >
                          <span className="material-symbols-outlined text-lg">info</span>
                          Message Info
                        </button>
                      )}
                    </div>
                  )}

                  {messageActionsView === 'delete' && (
                    <div className="py-2">
                      <p className="px-4 py-3 text-xs text-slate-500 border-b border-gray-100">
                        Delete this message?
                      </p>
                      <button
                        onClick={() => handleDeleteMessage('me')}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50"
                      >
                        Delete for Me
                      </button>
                      {isMyMessage(messageActionsFor) && (
                        <button
                          onClick={() => handleDeleteMessage('everyone')}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete for Everyone
                        </button>
                      )}
                      <button
                        onClick={() => setMessageActionsView('menu')}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-gray-50 border-t border-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {messageActionsView === 'info' && (
                    <div className="p-4 space-y-3 pb-6">
                      <h4 className="text-sm font-bold text-slate-800">Message Info</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Sent</span>
                          <span className="font-bold text-slate-700">
                            {formatFullTime(messageActionsFor.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Delivered</span>
                          <span className="font-bold text-slate-700">
                            {messageActionsFor.deliveredAt
                              ? formatFullTime(messageActionsFor.deliveredAt)
                              : 'Not yet delivered'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Read</span>
                          <span className="font-bold text-slate-700">
                            {messageActionsFor.readAt
                              ? formatFullTime(messageActionsFor.readAt)
                              : 'Not yet read'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reply Preview Bar */}
            {replyingTo && (
              <div className="flex-shrink-0 px-3 pt-2 bg-[#fff8ee]">
                <div className="flex items-center gap-2 bg-white border-l-4 border-[#570013] rounded-md px-3 py-2 shadow-2xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#570013]">
                      {isMyMessage(replyingTo) ? 'You' : selectedChat.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{replyingTo.body}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    aria-label="Cancel reply"
                  >
                    <span className="material-symbols-outlined text-lg block">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Message Input Box (Fixed Bottom) */}
            <div className="flex-shrink-0 p-3 bg-[#fff8ee] border-t border-amber-200/40 flex items-center gap-2 z-30">
              <div className="flex-1 bg-white border border-amber-200/80 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xs focus-within:border-[#570013]">
                <button type="button" disabled={chatPartnerBlocked} className="text-slate-400 hover:text-slate-600 flex-shrink-0 disabled:opacity-40">
                  <span className="material-symbols-outlined text-lg block">attach_file</span>
                </button>
                <input
                  type="text"
                  disabled={chatPartnerBlocked}
                  placeholder={chatPartnerBlocked ? 'Unblock to send a message' : 'Type a message...'}
                  value={newMessageText}
                  onChange={(e) => handleMessageInputChange(e.target.value, selectedChat.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(selectedChat.id)}
                  className="flex-1 bg-transparent text-xs font-medium text-slate-900 focus:outline-none placeholder-gray-400 min-w-0 disabled:cursor-not-allowed"
                />
                <button type="button" disabled={chatPartnerBlocked} className="text-slate-400 hover:text-slate-600 flex-shrink-0 disabled:opacity-40">
                  <span className="material-symbols-outlined text-lg block">photo_camera</span>
                </button>
              </div>

              <button
                onClick={() => handleSendMessage(selectedChat.id)}
                disabled={chatPartnerBlocked}
                className="w-9 h-9 rounded-full bg-[#570013] text-white flex items-center justify-center shadow hover:bg-[#72001a] active:scale-95 transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base block">
                  {newMessageText.trim() ? 'send' : 'mic'}
                </span>
              </button>
            </div>
          </div>
        )}
        {!selectedChat && (
          <div className="hidden lg:flex lg:flex-1 lg:order-2 lg:items-center lg:justify-center text-gray-400 text-sm font-medium">
            Select a conversation to start chatting
          </div>
        )}
          {/* CHATS LIST VIEW - Compact & Attractive Luxury Aesthetic */}
          <div className={`${selectedChat ? 'hidden lg:block' : 'block'} lg:order-1 px-3 sm:px-4 pt-0 pb-6 relative min-h-screen lg:min-h-0 lg:h-screen lg:overflow-y-auto lg:w-96 lg:shrink-0 lg:border-r lg:border-gray-200/80`}>
            {/* Chat header: replaces the global app header on this page */}
            <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 mb-3 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 bg-[#fbf9f5] border-b-2 border-[#c69a3d]">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => navigate('/home')}
                  className="p-1 rounded-full hover:bg-amber-100/60 active:scale-95 transition text-[#570013] -ml-1"
                  aria-label="Back to Home"
                >
                  <span className="material-symbols-outlined text-xl block">arrow_back</span>
                </button>
                <div>
                  <h1 className="text-lg font-display font-extrabold text-[#570013] leading-none flex items-center gap-1.5">
                    <span>Chats</span>
                    {chatsList.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-[#775a19] text-[9px] font-bold">
                        {chatsList.length}
                      </span>
                    )}
                  </h1>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    Connect & chat with verified matches
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setShowChatSearch((prev) => !prev)}
                  className={`p-1 rounded-full active:scale-95 transition ${
                    showChatSearch || chatSearchQuery
                      ? 'bg-[#570013] text-white shadow-2xs'
                      : 'text-[#570013] hover:bg-amber-100/60'
                  }`}
                  aria-label="Search conversations"
                  title="Search Chats"
                >
                  <span className="material-symbols-outlined text-lg block">
                    {showChatSearch && !chatSearchQuery ? 'close' : 'search'}
                  </span>
                </button>
                <button
                  onClick={() => handleTabNavigate('Interests')}
                  className="p-1 rounded-full text-[#570013] hover:bg-amber-100/60 active:scale-95 transition"
                  title="View Interests"
                >
                  <span className="material-symbols-outlined text-lg block">favorite</span>
                </button>
              </div>
            </div>

            {/* In-Chat Realtime Search Bar (Compact) */}
            {(showChatSearch || chatSearchQuery) && (
              <div className="mb-2.5">
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-gray-400 material-symbols-outlined text-base pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder="Search chats by candidate name..."
                    className="w-full pl-8 pr-7 py-1.5 bg-white rounded-lg border border-amber-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#570013] focus:ring-1 focus:ring-[#570013] shadow-2xs"
                    autoFocus
                  />
                  {chatSearchQuery && (
                    <button
                      onClick={() => setChatSearchQuery('')}
                      className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs block">close</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {chatError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-[10.5px] text-red-800 font-bold flex items-center justify-between">
                <span>{chatError}</span>
                <button onClick={() => setChatError('')} className="text-red-500 font-bold p-0.5">
                  ✕
                </button>
              </div>
            )}

            {/* Quick Connect / Recent Match Stories Row (Compact) */}
            {chatsList.length > 0 && !chatSearchQuery && (
              <div className="mb-2.5 pb-1.5 border-b border-gray-100/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                    Recent Connections
                  </span>
                  <span className="text-[9.5px] text-amber-800/80 font-bold">
                    {chatsList.length} Connected
                  </span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                  {chatsList.map((chat) => (
                    <button
                      key={`story-${chat.id}`}
                      onClick={() => handleOpenChat(chat)}
                      className="flex flex-col items-center gap-0.5 shrink-0 group cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full p-[1px] bg-gradient-to-tr from-amber-400 via-rose-300 to-amber-500 shadow-2xs group-hover:scale-105 transition-transform">
                          <div className="w-full h-full rounded-full bg-white overflow-hidden p-0.5">
                            {chat.image ? (
                              <img
                                src={avatarSrc(chat.image)}
                                onError={handleAvatarError}
                                alt={chat.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-amber-50 text-[#570013] flex items-center justify-center font-bold text-[10px]">
                                {chat.name?.[0] || 'C'}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Active Online Indicator */}
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full shadow-2xs" />
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-700 max-w-[46px] truncate group-hover:text-[#570013] leading-tight">
                        {chat.name?.split(' ')?.[0] || chat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter Pills (Compact) */}
            {chatsList.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-0.5 scrollbar-none">
                {[
                  { id: 'all', label: 'All Messages', count: chatsList.length },
                  { id: 'unread', label: 'Unread', count: chatsList.filter((c) => c.unreadCount > 0).length },
                  { id: 'verified', label: 'Verified', count: chatsList.filter((c) => c.verified).length },
                ].map((tab) => {
                  const isActive = chatFilterTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setChatFilterTab(tab.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#570013] text-white shadow-2xs'
                          : 'bg-white border border-amber-200/80 text-gray-600 hover:bg-amber-50/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span
                          className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-extrabold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-[#775a19]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Chats List Render (Compact Cards) */}
            {(() => {
              const filteredList = chatsList.filter((chat) => {
                const matchesSearch = chatSearchQuery.trim()
                  ? (chat.name || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                    (chat.lastMessage || '').toLowerCase().includes(chatSearchQuery.toLowerCase())
                  : true
                const matchesTab =
                  chatFilterTab === 'unread'
                    ? chat.unreadCount > 0
                    : chatFilterTab === 'verified'
                    ? chat.verified
                    : true
                return matchesSearch && matchesTab
              })

              return (
                <div className="space-y-1.5">
                  {isLoadingChats && chatsList.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-400 font-semibold bg-white rounded-xl border border-gray-100 shadow-2xs">
                      <div className="w-6 h-6 border-2 border-[#570013] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading conversations...
                    </div>
                  )}

                  {!isLoadingChats && chatsList.length === 0 && (
                    <div className="bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF8F0] border border-amber-200/70 rounded-xl p-5 text-center shadow-xs">
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-[#570013] border border-amber-200 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          forum
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-[#570013] font-display">No Conversations Yet</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto leading-relaxed">
                        Chats open instantly once a candidate accepts your interest or sends you a request.
                      </p>
                      <button
                        onClick={() => handleTabNavigate('Matches')}
                        className="mt-3 px-3.5 py-1.5 bg-[#570013] hover:bg-[#72001a] text-white font-bold rounded-full text-[11px] shadow-2xs active:scale-95 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">favorite</span>
                        <span>Explore Matches</span>
                      </button>
                    </div>
                  )}

                  {!isLoadingChats && chatsList.length > 0 && filteredList.length === 0 && (
                    <div className="text-center py-8 px-4 bg-white rounded-xl border border-gray-100 text-gray-400 text-xs font-semibold shadow-2xs">
                      No matching chats found for "{chatSearchQuery}".
                    </div>
                  )}

                  {filteredList.map((chat) => {
                    const isTyping = typingConversationId === chat.id
                    const hasUnread = chat.unreadCount > 0

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleOpenChat(chat)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer relative group flex items-center justify-between gap-2.5 ${
                          hasUnread
                            ? 'bg-gradient-to-r from-amber-50/80 via-white to-[#FFF9F3] border-amber-300 shadow-xs'
                            : 'bg-white hover:bg-[#FFFDF9] border-amber-200/70 hover:border-amber-300 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Avatar with Gold Ring & Online Indicator */}
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[1.2px] bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-2xs overflow-hidden bg-white">
                              {chat.image ? (
                                <img
                                  src={avatarSrc(chat.image)}
                                  onError={handleAvatarError}
                                  alt={chat.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-amber-50 text-[#570013] flex items-center justify-center font-bold text-xs">
                                  <span className="material-symbols-outlined text-lg">person</span>
                                </div>
                              )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full shadow-2xs" />
                          </div>

                          {/* Candidate & Last Message details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h3 className="font-extrabold text-xs sm:text-[13px] text-slate-900 truncate leading-tight group-hover:text-[#570013] transition-colors">
                                {chat.name}
                              </h3>
                              {chat.verified && (
                                <span
                                  className="material-symbols-outlined text-[13px] text-amber-500 shrink-0"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                  title="Verified Profile"
                                >
                                  verified
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 mt-0.5">
                              {isTyping ? (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                                  Typing...
                                </span>
                              ) : (
                                <p
                                  className={`text-[10.5px] sm:text-[11px] truncate leading-tight ${
                                    hasUnread ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'
                                  }`}
                                >
                                  {chat.lastMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Info: Time, Unread Badge & Chevron */}
                        <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              hasUnread
                                ? 'bg-[#570013] text-white font-bold'
                                : 'text-amber-900/70 bg-amber-50/80 border border-amber-200/50'
                            }`}
                          >
                            {chat.time}
                          </span>

                          <div className="flex items-center gap-0.5 mt-0.5">
                            {hasUnread && (
                              <span className="w-4 h-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                                {chat.unreadCount}
                              </span>
                            )}
                            <span className="material-symbols-outlined text-[14px] text-gray-300 group-hover:text-[#570013] group-hover:translate-x-0.5 transition-all">
                              chevron_right
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Safety & Matrimonial Trust Footer Card (Compact) */}
                  {chatsList.length > 0 && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-amber-50/70 via-[#FFFDF9] to-amber-50/50 rounded-lg border border-amber-200/60 flex items-center gap-2 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-[#775a19] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xs">verified_user</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-[#570013] leading-tight">Private & Verified Chats</p>
                        <p className="text-[8.5px] text-gray-500 leading-tight">
                          End-to-end safe communication for family privacy.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      ) : activeTab === 'Interests' ? (
        /* INTERESTS PAGE VIEW */
        <div className="px-4 pt-0">
          {/* Page header: replaces the global app header on this page */}
          <div className="sticky top-0 z-30 -mx-4 mb-4 px-4 py-3 flex items-center gap-2 bg-[#fbf9f5] border-b-2 border-[#c69a3d]">
            <button
              onClick={() => navigate('/home')}
              className="p-1 rounded-full hover:bg-amber-100/60 active:scale-95 transition text-[#570013] -ml-1"
              aria-label="Back to Home"
            >
              <span className="material-symbols-outlined text-2xl block">arrow_back</span>
            </button>
            <h1 className="text-lg font-display font-extrabold text-[#570013]">Interests</h1>
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
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
            {filteredInterests.length > 0 ? (
              filteredInterests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 border border-gray-100/90 shadow-sm flex flex-col gap-3 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3.5">
                    {/* User Avatar */}
                    <div className="relative w-14 h-14 rounded-full flex-shrink-0 bg-amber-50 flex items-center justify-center overflow-hidden border border-gray-200">
                      {item.image ? (
                        <img
                          src={avatarSrc(item.image)} onError={handleAvatarError}
                          alt={item.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-[#570013]">person</span>
                      )}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate mb-0.5">
                        {[item.age, item.city].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {item.direction === 'Received' ? `Received on ${item.date}` : `Sent on ${item.date}`}
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

                  {interestsTab === 'Sent' && (
                    <div className="pt-1">
                      <button
                        onClick={(e) => handleUpdateInterestStatus(item.id, 'Cancelled', e)}
                        className="w-full py-2.5 rounded-md bg-white border border-[#570013] text-[#570013] font-bold text-xs hover:bg-red-50 transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">undo</span>
                        <span>Withdraw Interest</span>
                      </button>
                    </div>
                  )}

                  {interestsTab === 'Accepted' && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Interest Accepted • Contact Details Unlocked</span>
                      </div>
                      <button
                        onClick={(e) => handleMessageCandidate(item.profileId, e)}
                        className="w-full py-2.5 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">chat</span>
                        <span>Message</span>
                      </button>
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
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base block">close</span>
                </button>
              )}
            </div>

            {/* Run Search */}
            <button
              onClick={() => runSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="w-11 h-11 rounded-md border border-[#570013] bg-[#570013] text-white transition shadow-sm flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Run search"
            >
              <span className="material-symbols-outlined text-lg block">
                {isSearching ? 'hourglass_top' : 'search'}
              </span>
            </button>

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
                {isSearching ? 'Searching...' : `Search Results (${filteredSearchList.length})`}
              </h2>

              {filteredSearchList.length > 0 ? (
                filteredSearchList.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectProfile && onSelectProfile(match)}
                    className="bg-white rounded-md p-2.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={avatarSrc(match.image)} onError={handleAvatarError}
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
                        onClick={() => {
                          setSearchQuery(item.query || item.title)
                          runSearch(item.query || item.title)
                        }}
                        className="bg-white border border-gray-100/90 rounded-md p-2 flex items-center justify-between shadow-2xs hover:bg-gray-50/70 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-base text-[#570013]">history</span>
                          </div>
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
        /* MATCHES PAGE VIEW - Design Reference Layout */
        <div className="pb-24 w-full bg-[#FAF7F2] min-h-screen">
          {/* 1. Regal Maroon Header with Curved Bottom */}
          <div className="bg-gradient-to-r from-[#4A000F] via-[#5D0014] to-[#3E000C] text-white px-4 pt-2.5 pb-3 sm:px-6 rounded-b-lg shadow-md relative overflow-hidden">
            {/* Delicate gold filigree lines in background */}
            <svg className="absolute -right-4 -top-4 w-44 h-44 opacity-20 pointer-events-none text-[#ffd580]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M50 50 C40 20, 20 40, 50 50 Z" />
              <path d="M50 50 C70 20, 90 40, 50 50 Z" />
              <path d="M50 50 C80 50, 90 80, 50 50 Z" />
              <path d="M50 50 C50 80, 30 90, 50 50 Z" />
              <path d="M50 50 C20 70, 10 50, 50 50 Z" />
              <circle cx="50" cy="50" r="8" strokeWidth="0.6" strokeDasharray="1 1" />
            </svg>
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="max-w-md sm:max-w-xl lg:max-w-5xl mx-auto flex items-center justify-between gap-3 relative z-10">
              {/* Back Button + Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center active:scale-95 transition cursor-pointer shrink-0 hover:bg-slate-50"
                  aria-label="Back to Home"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-800 font-semibold">arrow_back</span>
                </button>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight leading-tight truncate">
                    Discover Matches
                  </h1>
                  <p className="text-[10.5px] text-white/80 font-medium leading-tight truncate">
                    Curated profiles for you
                  </p>
                </div>
              </div>

              {/* Filter Button + Notification Bell */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/preferences')}
                  className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center active:scale-95 transition cursor-pointer shrink-0 hover:bg-slate-50"
                  title="Partner Preferences & Filters"
                  aria-label="Filter"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-700">tune</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabNavigate('Notifications')}
                  className="relative w-8 h-8 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center active:scale-95 transition cursor-pointer shrink-0 hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-700">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-md sm:max-w-xl lg:max-w-5xl mx-auto px-4 sm:px-6 pt-2.5">
            {/* 2. Primary Category Switcher (All Matches, Nearby, Interests) */}
            <div className="bg-[#FAF5EC] p-0.5 rounded-lg border border-[#EBDDC8] shadow-2xs flex items-center justify-between gap-1 mb-2.5">
              {[
                { id: 'All', label: 'All Matches', icon: 'groups' },
                { id: 'Nearby', label: 'Nearby', icon: 'location_on' },
                { id: 'Interested', label: 'Interests', icon: 'favorite_border' },
              ].map((tab) => {
                const isActive = matchesCategory === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMatchesCategory(tab.id)}
                    className={`flex-1 py-1.5 px-2 sm:px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
                      isActive
                        ? 'bg-white text-[#7A0C1E] border border-[#EBDDC8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] shrink-0 ${isActive ? 'text-[#7A0C1E]' : 'text-slate-500'}`}
                      style={{ fontVariationSettings: tab.id === 'Interested' && isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {tab.id === 'Interested' && isActive ? 'favorite' : tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 3. Quick Filter Pills Row (All Profiles, Verified Only, 85%+ Match, etc.) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 mb-2">
              {[
                { id: 'All', label: 'All Profiles' },
                { id: 'Verified', label: 'Verified Only', icon: 'verified' },
                { id: 'HighMatch', label: '85%+ Match', icon: 'stars' },
                { id: 'Kundali', label: 'Kundali Match', icon: 'auto_awesome' },
                { id: 'GovtOrBusiness', label: 'Govt & Business', icon: 'business_center' },
              ].map((pill) => {
                const isSelected = matchQuickFilter === pill.id
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setMatchQuickFilter(pill.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#570013] text-white border-[#570013] shadow-xs'
                        : 'bg-white text-slate-800 hover:bg-[#FAF5EC] border-[#EBDDC8] shadow-2xs'
                    }`}
                  >
                    {pill.icon && (
                      <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-amber-300' : 'text-[#C8973A]'}`}>
                        {pill.icon}
                      </span>
                    )}
                    <span>{pill.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 4. Sort Row */}
            <div className="flex items-center justify-end gap-2 mb-2.5">
              <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
              <div className="relative">
                <select
                  value={matchSortBy}
                  onChange={(e) => setMatchSortBy(e.target.value)}
                  className="bg-white border border-[#EBDDC8] text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-1 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#570013] cursor-pointer appearance-none"
                >
                  <option value="compatibility">Highest Compatibility</option>
                  <option value="age_asc">Age: Youngest First</option>
                  <option value="age_desc">Age: Senior First</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Preference filter banner reminder */}
            {preferenceFilter && (
              <div className="mb-3 p-2 bg-gradient-to-r from-amber-50 to-[#fffdfa] border border-amber-200/90 rounded-lg flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-base text-[#c69a3d] shrink-0">tune</span>
                  <p className="text-[11.5px] font-semibold text-amber-950 leading-snug">
                    {preferenceFilter.beforeFilter > preferenceFilter.shown
                      ? `Showing ${preferenceFilter.shown} of ${preferenceFilter.beforeFilter} candidates matching your partner preferences.`
                      : 'Curated by your custom partner preferences.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/preferences')}
                  className="text-xs font-bold text-[#570013] hover:underline shrink-0 cursor-pointer"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Matches Profiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(() => {
                let filteredMatches = matchesList.filter((match) => {
                  const isItemInterested = !!interested[match.id] || match.isMockInterested
                  if (matchesCategory === 'Interested') {
                    return isItemInterested
                  } else if (matchesCategory === 'Nearby') {
                    return !isItemInterested && (match.isNearby || match.city?.includes('Jaipur') || match.city?.includes('Rajasthan') || match.city?.includes('Delhi') || match.city?.includes('Indore'))
                  } else {
                    return !isItemInterested
                  }
                })

                // Apply Quick Filter Pill
                if (matchQuickFilter === 'Verified') {
                  filteredMatches = filteredMatches.filter((m) => !!m.verified)
                } else if (matchQuickFilter === 'HighMatch') {
                  filteredMatches = filteredMatches.filter((m) => (m.compatibility || m.matchScore || 0) >= 85)
                } else if (matchQuickFilter === 'Kundali') {
                  filteredMatches = filteredMatches.filter((m) => m.gotra || m.motherGotra)
                } else if (matchQuickFilter === 'GovtOrBusiness') {
                  filteredMatches = filteredMatches.filter((m) => {
                    const prof = (m.profession || '').toLowerCase()
                    return prof.includes('business') || prof.includes('govt') || prof.includes('officer') || prof.includes('ca') || prof.includes('engineer') || prof.includes('doctor')
                  })
                }

                // Apply Sorting
                filteredMatches = [...filteredMatches].sort((a, b) => {
                  if (matchSortBy === 'compatibility') {
                    const scoreA = a.compatibility || a.matchScore || 0
                    const scoreB = b.compatibility || b.matchScore || 0
                    return scoreB - scoreA
                  } else if (matchSortBy === 'age_asc') {
                    return (a.age || 0) - (b.age || 0)
                  } else if (matchSortBy === 'age_desc') {
                    return (b.age || 0) - (a.age || 0)
                  }
                  return 0
                })

                if (filteredMatches.length === 0) {
                  return (
                    <div className="text-center py-14 px-6 bg-gradient-to-b from-white via-[#fffdfa] to-amber-50/30 rounded-lg border border-amber-200/80 shadow-sm col-span-full">
                      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3.5 shadow-2xs text-[#775a19]">
                        <span className="material-symbols-outlined text-3xl">favorite_border</span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#570013] mb-1 font-display">
                        No matching profiles found
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
                        {matchesCategory === 'Interested'
                          ? 'Tap "Send Interest" on candidates you like to build your shortlist here.'
                          : 'Try adjusting your quick filter or partner preferences to view more eligible Agarwal candidates.'}
                      </p>
                      {matchQuickFilter !== 'All' && (
                        <button
                          type="button"
                          onClick={() => setMatchQuickFilter('All')}
                          className="px-4 py-2 rounded-full bg-[#570013] hover:bg-[#72001a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Reset Quick Filters
                        </button>
                      )}
                    </div>
                  )
                }

                return filteredMatches.map((match) => {
                  const matchScore = match.compatibility || match.matchScore || 92
                  const isShortlisted = !!favorites[match.id]

                  return (
                    <div
                      key={match.id}
                      onClick={() => onSelectProfile && onSelectProfile(match)}
                      className="bg-white rounded-xl border border-[#EBDDC8] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col group relative max-w-md mx-auto w-full"
                    >
                      {/* Photo Section with Overlay Badges */}
                      <div className="w-full h-64 sm:h-72 relative bg-slate-100 overflow-hidden">
                        <img
                          src={avatarSrc(match.image)}
                          onError={handleAvatarError}
                          alt={match.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />

                        {/* Top Badges (Match Score & Active Status) */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                          {/* Match % Pill */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B705C] text-white text-[11px] font-bold shadow-md border border-white/20">
                            <span className="material-symbols-outlined text-[14px] text-emerald-200">check_circle</span>
                            <span>{matchScore}% Match</span>
                          </span>

                          {/* Active Indicator Pill */}
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium shadow-md border border-white/15">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Active</span>
                          </span>
                        </div>

                        {/* Circular Shortlist Heart Action Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(match.id, e)}
                          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-200 z-10 cursor-pointer active:scale-90 ${
                            isShortlisted
                              ? 'bg-rose-50 text-rose-600 border border-rose-300'
                              : 'bg-white/95 text-slate-700 hover:text-rose-600 hover:bg-white border border-white/60'
                          }`}
                          title={isShortlisted ? 'Shortlisted' : 'Shortlist Profile'}
                          aria-label="Shortlist profile"
                        >
                          <span
                            className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:scale-110"
                            style={{ fontVariationSettings: isShortlisted ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                        </button>

                        {/* Carousel Pagination Dots */}
                        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
                          <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-xs" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-xs" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-xs" />
                        </div>
                      </div>

                      {/* Card Content Section with curved top overlapping photo */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white rounded-t-xl -mt-3 relative z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                        <div>
                          {/* Name, Age, & Verified Badge */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900 tracking-tight truncate">
                              {match.name}{match.age ? `, ${match.age}` : ''}
                            </h3>
                            {match.verified && (
                              <span
                                className="material-symbols-outlined text-[#C8973A] text-[20px] shrink-0"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                                title="Verified Profile"
                              >
                                verified
                              </span>
                            )}
                          </div>

                          {/* Occupation */}
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1 truncate">
                            <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">business_center</span>
                            <span className="truncate">{match.profession || 'Software Engineer'}</span>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5 truncate">
                            <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                            <span className="truncate">{match.city || 'Indore, Madhya Pradesh'}</span>
                          </div>

                          {/* 3 Pills Feature Row (Height, Marital Status, Diet) */}
                          <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                            {/* Height */}
                            <div className="flex-1 bg-[#FAF6F0] border border-[#EFE5D5] rounded-md py-1 px-2 flex items-center justify-center gap-1 text-slate-800 text-[11.5px] font-semibold truncate shadow-2xs">
                              <span className="material-symbols-outlined text-[#9E7238] text-[15px] shrink-0">accessibility_new</span>
                              <span className="truncate">{match.height || "5'10\""}</span>
                            </div>

                            {/* Marital Status */}
                            <div className="flex-1 bg-[#FAF6F0] border border-[#EFE5D5] rounded-md py-1 px-2 flex items-center justify-center gap-1 text-slate-800 text-[11.5px] font-semibold truncate shadow-2xs">
                              <span className="material-symbols-outlined text-[#9E7238] text-[16px] shrink-0">all_inclusive</span>
                              <span className="truncate">{match.maritalStatus || 'Never Married'}</span>
                            </div>

                            {/* Diet */}
                            <div className="flex-1 bg-[#FAF6F0] border border-[#EFE5D5] rounded-md py-1 px-2 flex items-center justify-center gap-1 text-slate-800 text-[11.5px] font-semibold truncate shadow-2xs">
                              <span className="material-symbols-outlined text-emerald-600 text-[15px] shrink-0">eco</span>
                              <span className="truncate">{match.diet || 'Vegetarian'}</span>
                            </div>
                          </div>
                        </div>

                        {/* View Profile CTA Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectProfile && onSelectProfile(match)
                          }}
                          className="w-full bg-[#570013] hover:bg-[#6e0b18] text-white font-bold text-xs py-2 px-5 rounded-lg shadow-md flex items-center justify-center relative active:scale-98 transition cursor-pointer mt-3 group"
                        >
                          <span>View Profile</span>
                          <span className="material-symbols-outlined text-base absolute right-5 top-1/2 -translate-y-1/2 group-hover:translate-x-0.5 transition-transform">
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
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
                        <img src={avatarSrc(userProfile.profilePicture)} onError={handleAvatarError} alt="Profile" className="w-full h-full object-cover" />
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

                {/* Contact Information */}
                <div className="p-2 space-y-3 pb-2 border-t border-amber-200/60 pt-3">
                  <h2 className="font-bold text-[#570013] text-base border-b-2 border-[#570013]/20 pb-1.5 uppercase tracking-wide">Contact Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                      <div className="text-gray-500 text-[10px] leading-tight">Mobile Number</div>
                      <div className="font-semibold text-gray-800 text-[11px]">{userProfile.mobileNumber || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[10px] leading-tight">Email Address</div>
                      <div className="font-semibold text-gray-800 text-[11px]">{userProfile.email || '-'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-gray-500 text-[10px] leading-tight">Residential Address</div>
                      <div className="font-semibold text-gray-800 text-[11px]">{userProfile.residentialAddress || '-'}</div>
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
        <div className="px-4 sm:px-6 pt-3 pb-8 space-y-6 max-w-2xl mx-auto w-full">
          {/* 2. Hero / Connection Banner (Compact) */}
          <div className="bg-gradient-to-br from-[#4f0714] via-[#6f0c1f] to-[#3f030c] rounded-2xl py-3 px-3.5 sm:py-3.5 sm:px-4.5 text-white shadow-md relative overflow-hidden">
            {/* Subtle decorative background flourishes */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-rose-500/10 rounded-full blur-lg pointer-events-none" />
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-50,80 Q100,-20 250,90 T500,60" fill="none" stroke="#fed488" strokeWidth="1.5" />
              <path d="M-20,120 Q120,40 300,130 T600,100" fill="none" stroke="#fed488" strokeWidth="1" />
            </svg>

            <div className="flex items-center justify-between gap-2.5 relative z-10">
              {/* Left Column: Headline, Text & CTA */}
              <div className="flex-1 min-w-0 pr-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight font-display">
                  Create meaningful connections
                </h2>
                <p className="text-[11px] text-white/85 mt-0.5 leading-snug line-clamp-2 max-w-[210px]">
                  Find someone who matches your values and lifestyle
                </p>
                <button
                  onClick={() => handleTabNavigate('Matches')}
                  className="mt-2.5 px-3 py-1.5 rounded-full bg-white text-[#570013] font-bold text-[11px] shadow-sm hover:bg-amber-50 active:scale-95 transition flex items-center gap-1 cursor-pointer group"
                >
                  <span>Explore Matches</span>
                  <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </button>
              </div>

              {/* Right Column: Overlapping Couple Circles & Heart */}
              <div className="relative shrink-0 flex items-center justify-center pr-1">
                <div className="relative flex items-center">
                  {/* Bride Avatar */}
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 border-amber-300 shadow-md overflow-hidden bg-amber-100/30 shrink-0">
                    <img
                      src="/assets/hero-bride.jpg"
                      alt="Bride"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Groom Avatar */}
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 border-amber-300 shadow-md overflow-hidden bg-amber-100/30 shrink-0 -ml-4">
                    <img
                      src="/assets/hero-groom.jpg"
                      alt="Groom"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Floating Heart Badge */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 border-2 border-white shadow-xs flex items-center justify-center animate-pulse z-20">
                    <span className="material-symbols-outlined text-white text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Profile Completion Card */}
          {(() => {
            const homePct = Number(userProfile?.completionPercentage ?? 75);
            return (
              <div className="bg-gradient-to-r from-[#FFFDF9] via-[#FFF9F2] to-[#FFF4E8] border border-[#F4DFC8] rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 shadow-xs flex items-center justify-between gap-2.5">
                {/* Progress Ring (Compact) */}
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#F6DFCF]"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#570013] transition-all duration-700 ease-out"
                      strokeDasharray={`${homePct}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-extrabold text-[#570013] text-[10px] sm:text-[11px] font-display">{homePct}%</span>
                </div>

                {/* Middle Text Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-extrabold text-xs sm:text-[12.5px] text-[#570013] font-display leading-tight truncate">
                    Complete Your Profile
                  </h3>
                  <p className="text-[10px] sm:text-[10.5px] text-gray-500 leading-tight mt-0.5 line-clamp-1">
                    Add more details to get better and relevant matches.
                  </p>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={() => navigate('/profile-completion-dashboard')}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#570013] hover:bg-[#72001a] text-white font-bold text-[10.5px] sm:text-[11px] shadow-xs flex items-center gap-1 active:scale-95 transition shrink-0 cursor-pointer"
                >
                  <span>{homePct >= 100 ? 'Edit' : 'Complete'}</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>
            );
          })()}

          {/* 4. Recommended / Today's Matches Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-lg">auto_awesome</span>
                <h2 className="text-base font-extrabold text-[#570013] font-display">
                  Recommended For You
                </h2>
              </div>
              <button
                onClick={() => navigate('/matches')}
                className="text-xs font-bold text-[#570013] hover:text-[#72001a] flex items-center gap-0.5 cursor-pointer"
              >
                <span>See All</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Profile Cards Carousel */}
            {(() => {
              const displayMatches = (todayMatches && todayMatches.length > 0)
                ? todayMatches
                : (matchesList && matchesList.length > 0)
                ? matchesList
                : []

              if (displayMatches.length === 0) {
                return (
                  <div className="p-6 bg-white rounded-xl border border-gray-100 text-center shadow-xs">
                    <p className="text-xs text-gray-500 font-medium">No matches available right now.</p>
                    <button
                      onClick={() => navigate('/matches')}
                      className="mt-2 text-xs font-bold text-[#570013] underline"
                    >
                      Browse All Profiles
                    </button>
                  </div>
                )
              }

              return (
                <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none -mx-1 px-1 snap-x">
                  {displayMatches.map((match) => (
                    <div
                      key={match.id}
                      onClick={() => onSelectProfile && onSelectProfile(match)}
                      className="w-44 sm:w-48 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative group snap-start p-2.5"
                    >
                      {/* Match Photo */}
                      <div className="w-full h-44 rounded-lg overflow-hidden relative bg-amber-50/50 mb-2.5">
                        <img
                          src={avatarSrc(match.image)}
                          onError={handleAvatarError}
                          alt={match.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Online Indicator Dot */}
                        <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs" />

                        {/* Favorite Action Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(match.id, e)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white active:scale-90 transition cursor-pointer"
                          title="Shortlist profile"
                        >
                          <span
                            className={`material-symbols-outlined text-[17px] ${
                              favorites[match.id] ? 'text-red-600' : 'text-slate-400 group-hover:text-red-500'
                            }`}
                            style={{ fontVariationSettings: favorites[match.id] ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                        </button>
                      </div>

                      {/* Card Info */}
                      <div className="px-0.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <h3 className="font-extrabold text-xs text-slate-900 truncate">
                            {match.name}
                          </h3>
                          {match.verified && (
                            <span
                              className="material-symbols-outlined text-blue-600 text-[14px] shrink-0"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              title="Verified Profile"
                            >
                              verified
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium truncate mb-2">
                          {match.age ? `${match.age} yrs` : '26 yrs'} • {match.height || "5'6\""} • {match.city || 'Delhi'}
                        </p>

                        {/* Badges / Tags */}
                        <div className="flex flex-wrap items-center gap-1">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{match.matchScore ?? match.compatibility ?? 85}% Match</span>
                          </div>

                          {match.gotra ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#570013] border border-rose-100 text-[10px] font-semibold truncate max-w-[90px]">
                              {match.gotra}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#775a19] border border-amber-200/60 text-[10px] font-semibold truncate max-w-[90px]">
                              {match.profession || 'Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* 5. Quick Actions Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-[#570013] text-lg">bolt</span>
              <h2 className="text-base font-extrabold text-[#570013] font-display">
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Action 1: Search Profiles */}
              <button
                type="button"
                onClick={() => handleTabNavigate('Search')}
                className="bg-[#FDF3F1] border border-rose-200/70 hover:border-rose-300 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs hover:shadow-xs active:scale-98 transition cursor-pointer text-left group overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[17px]">search</span>
                  </div>
                  <span className="font-bold text-[11px] sm:text-xs text-slate-800 leading-tight line-clamp-2 pr-1">
                    Search Profiles
                  </span>
                </div>
                <span className="material-symbols-outlined text-rose-400 group-hover:translate-x-0.5 transition-transform text-base shrink-0 ml-auto">
                  chevron_right
                </span>
              </button>

              {/* Action 2: Interests & Preferences */}
              <button
                type="button"
                onClick={() => handleTabNavigate('Interests')}
                className="bg-[#FDF8EE] border border-amber-200/70 hover:border-amber-300 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs hover:shadow-xs active:scale-98 transition cursor-pointer text-left group overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[17px]">tune</span>
                  </div>
                  <span className="font-bold text-[11px] sm:text-xs text-slate-800 leading-tight line-clamp-2 pr-1">
                    Interests & Preferences
                  </span>
                </div>
                <span className="material-symbols-outlined text-amber-500 group-hover:translate-x-0.5 transition-transform text-base shrink-0 ml-auto">
                  chevron_right
                </span>
              </button>

              {/* Action 3: Messages */}
              <button
                type="button"
                onClick={() => handleTabNavigate('Messages')}
                className="bg-[#F1F7FE] border border-blue-200/70 hover:border-blue-300 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs hover:shadow-xs active:scale-98 transition cursor-pointer text-left group overflow-hidden relative"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs relative">
                    <span className="material-symbols-outlined text-[17px]">chat</span>
                    {totalUnreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {totalUnreadMessages}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-[11px] sm:text-xs text-slate-800 leading-tight line-clamp-2 pr-1">
                    Messages
                  </span>
                </div>
                <span className="material-symbols-outlined text-blue-400 group-hover:translate-x-0.5 transition-transform text-base shrink-0 ml-auto">
                  chevron_right
                </span>
              </button>

              {/* Action 4: Profile Visitors */}
              <button
                type="button"
                onClick={() => setActiveModal('Visitors')}
                className="bg-[#F8F3FE] border border-purple-200/70 hover:border-purple-300 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs hover:shadow-xs active:scale-98 transition cursor-pointer text-left group overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[17px]">visibility</span>
                  </div>
                  <span className="font-bold text-[11px] sm:text-xs text-slate-800 leading-tight line-clamp-2 pr-1">
                    Profile Visitors
                  </span>
                </div>
                <span className="material-symbols-outlined text-purple-400 group-hover:translate-x-0.5 transition-transform text-base shrink-0 ml-auto">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Bio Data Action Card (View / PDF Export) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-amber-500/10 border border-amber-300/80 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#570013] text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-[#570013] tracking-wide uppercase leading-tight font-display">
                    Your Official Bio Data
                  </h3>
                  <p className="text-[11px] text-[#775a19] font-medium leading-tight mt-0.5">
                    View candidate preview or export customized PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleTabNavigate('MyProfile')}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-amber-300 text-[#570013] font-bold text-xs hover:bg-amber-50 active:scale-95 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
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
                  className="px-3.5 py-1.5 rounded-full bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs active:scale-95 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Bottom Navigation Dock (Reference Design) */}
      {!selectedChat && activeTab !== 'MyProfile' && (
        <nav
          className="lg:hidden fixed bottom-3 left-3 right-3 sm:max-w-md sm:mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full px-2 py-1.5 z-50 flex items-center justify-between gap-1 select-none transition-all"
          aria-label="Bottom Navigation"
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id || (activeTab === 'Notifications' && tab.id === 'Home')
            if (isActive) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabNavigate(tab.id)}
                  aria-label={tab.label}
                  className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#570013] text-white shadow-md shadow-[#570013]/25 active:scale-95 transition-all duration-300 ease-out cursor-pointer shrink-0"
                >
                  <span
                    className="material-symbols-outlined text-[20px] text-white leading-none"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {tab.icon}
                  </span>
                  <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap">
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span className="ml-1 min-w-[16px] h-4 px-1 bg-amber-400 text-[#570013] text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabNavigate(tab.id)}
                aria-label={tab.label}
                className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 active:scale-90 transition-all duration-200 cursor-pointer shrink-0"
              >
                <span
                  className="material-symbols-outlined text-[22px] transition-colors leading-none"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                {tab.badge && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      )}

      {/* Full Modal Overlay Views (Visitors, Saved, Help & Support) */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            {/* Modal Header */}
            <div className="bg-[#570013] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300 text-xl">
                  {activeModal === 'Visitors' ? 'group' : activeModal === 'Saved' ? 'bookmark' : 'support_agent'}
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
                  <p className="text-xs text-slate-500 font-medium">
                    {isLoadingModal
                      ? 'Loading recent visitors…'
                      : visitorsList.length === 0
                      ? 'No one has viewed this profile yet.'
                      : `${visitorsList.length} member${visitorsList.length === 1 ? '' : 's'} viewed your profile recently:`}
                  </p>
                  {visitorsList.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <img src={avatarSrc(v.image)} onError={handleAvatarError} alt={v.name} className="w-10 h-10 rounded-full object-cover border border-amber-200" />
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
                  <p className="text-xs text-slate-500 font-medium">
                    {isLoadingModal
                      ? 'Loading your shortlist…'
                      : savedList.length === 0
                      ? 'You have not shortlisted anyone yet.'
                      : 'Your bookmarked & saved profiles:'}
                  </p>
                  {savedList.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <img src={avatarSrc(s.image)} onError={handleAvatarError} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-amber-200" />
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-red-100 text-left relative">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Delete Account Permanently?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              This action <span className="font-bold text-red-600">cannot be undone</span>. All your candidate biodata, photos, saved matches, and conversations will be permanently erased.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
              <p className="text-[11px] font-semibold text-red-800 mb-1.5">
                Type <span className="font-extrabold underline tracking-wider">DELETE</span> below to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value)
                  setDeleteAccountError('')
                }}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-md text-xs font-bold text-red-700 tracking-wider focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-300 placeholder:font-normal"
                autoFocus
              />
            </div>

            {deleteAccountError && (
              <p className="text-[11px] text-red-600 font-semibold mb-3">
                {deleteAccountError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAccountModal(false)
                  setDeleteConfirmText('')
                  setDeleteAccountError('')
                }}
                disabled={isDeletingAccount}
                className="flex-1 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
