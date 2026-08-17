import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('Banners') // 'Banners' | 'StaticPages'
  const [banners, setBanners] = useState([])
  const [staticContent, setStaticContent] = useState({
    aboutUs: '',
    contactUs: '',
    privacyPolicy: '',
    termsOfService: '',
    communityGuidelines: '',
  })

  const [toastMsg, setToastMsg] = useState('')
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)

  // Banner Form State
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkTarget, setLinkTarget] = useState('/matches')
  const [bannerStatus, setBannerStatus] = useState('Active')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const [b, sc] = await Promise.all([
        adminDataService.getBanners(),
        adminDataService.getStaticContent(),
      ])
      setBanners(b)
      setStaticContent((prev) => ({ ...prev, ...sc }))
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load CMS content.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreateBanner = () => {
    setEditingBanner(null)
    setTitle('')
    setSubtitle('')
    setImageUrl('https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200')
    setLinkTarget('/matches')
    setBannerStatus('Active')
    setShowBannerModal(true)
  }

  const handleOpenEditBanner = (ban) => {
    setEditingBanner(ban)
    setTitle(ban.title)
    setSubtitle(ban.subtitle)
    setImageUrl(ban.imageUrl)
    setLinkTarget(ban.linkTarget)
    setBannerStatus(ban.status)
    setShowBannerModal(true)
  }

  const handleSaveBanner = async (e) => {
    e.preventDefault()
    const bannerObj = {
      id: editingBanner?.id,
      title,
      subtitle,
      imageUrl,
      linkTarget,
      status: bannerStatus,
      positionOrder: editingBanner?.positionOrder || banners.length + 1,
    }

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.saveBanner(bannerObj)
      await loadContent()
      setShowBannerModal(false)
      setToastMsg('Banner updated successfully! Reflecting live on customer homepage.')
      setTimeout(() => setToastMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save this banner.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Delete this banner from homepage slider?')) return

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.deleteBanner(bannerId)
      await loadContent()
      setToastMsg('Banner deleted.')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not delete this banner.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveStaticPages = async (e) => {
    e.preventDefault()

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.saveStaticContent(staticContent)
      setToastMsg('Static legal & company pages content updated! Reflecting live across platform.')
      setTimeout(() => setToastMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save the static page content.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout title="Content Management System">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
            ✕
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold">
          Loading CMS content...
        </div>
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-stone-900">
            Platform Content Management System (CMS)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            FRD Content Management: Manage homepage promotional banners, static company pages, and legal policy documentation.
          </p>
        </div>

        {activeTab === 'Banners' && (
          <button
            onClick={handleOpenCreateBanner}
            className="px-4 py-2.5 bg-gradient-to-r from-[#570013] to-[#800020] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Homepage Banner</span>
          </button>
        )}
      </div>

      {/* CMS MAIN TABS */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('Banners')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'Banners'
              ? 'bg-[#570013] text-white shadow-md'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">view_carousel</span>
          <span>Homepage Banners ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('StaticPages')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'StaticPages'
              ? 'bg-[#570013] text-white shadow-md'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">gavel</span>
          <span>Static & Legal Content CMS</span>
        </button>
      </div>

      {/* TAB 1: HOMEPAGE BANNERS */}
      {activeTab === 'Banners' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((ban) => (
              <div
                key={ban.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-stone-900">
                    <img
                      src={ban.imageUrl}
                      alt={ban.title}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ban.status === 'Active'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-500 text-white'
                        }`}
                      >
                        {ban.status}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
                      <h3 className="font-display font-bold text-base">{ban.title}</h3>
                      <p className="text-xs text-amber-200/90 truncate mt-0.5">{ban.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-mono">Target: {ban.linkTarget}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditBanner(ban)}
                      className="px-3 py-1.5 bg-white border border-stone-200 font-semibold text-stone-800 rounded-xl hover:bg-stone-100"
                    >
                      Edit Banner
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(ban.id)}
                      className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STATIC PAGES CMS */}
      {activeTab === 'StaticPages' && (
        <form onSubmit={handleSaveStaticPages} className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-display font-bold text-base text-stone-900 mb-1">About Us Content</h3>
            <p className="text-stone-500 text-[11px] mb-2">Reflects live on user /about page</p>
            <textarea
              rows="4"
              value={staticContent.aboutUs}
              onChange={(e) => setStaticContent({ ...staticContent, aboutUs: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div>
            <h3 className="font-display font-bold text-base text-stone-900 mb-1">Contact Us Details</h3>
            <p className="text-stone-500 text-[11px] mb-2">Office addresses, helpline numbers, support email</p>
            <textarea
              rows="3"
              value={staticContent.contactUs}
              onChange={(e) => setStaticContent({ ...staticContent, contactUs: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div>
            <h3 className="font-display font-bold text-base text-stone-900 mb-1">Privacy Policy</h3>
            <p className="text-stone-500 text-[11px] mb-2">Reflects live on user /privacy page</p>
            <textarea
              rows="4"
              value={staticContent.privacyPolicy}
              onChange={(e) => setStaticContent({ ...staticContent, privacyPolicy: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div>
            <h3 className="font-display font-bold text-base text-stone-900 mb-1">Terms & Conditions</h3>
            <p className="text-stone-500 text-[11px] mb-2">Reflects live on user /terms page</p>
            <textarea
              rows="4"
              value={staticContent.termsOfService}
              onChange={(e) => setStaticContent({ ...staticContent, termsOfService: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div className="pt-2 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#570013] text-white font-bold rounded-xl shadow-md hover:bg-[#42000e] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save All Legal & Company Pages'}
            </button>
          </div>
        </form>
      )}

      {/* BANNER EDIT MODAL */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-display font-bold text-base text-stone-900">
                {editingBanner ? 'Edit Banner' : 'Add New Homepage Banner'}
              </h3>
              <button
                onClick={() => setShowBannerModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Banner Headline</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Authentic Agrawal Biodatas"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Subtitle / Caption</label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Verified family & gotra details"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Route</label>
                  <input
                    type="text"
                    required
                    value={linkTarget}
                    onChange={(e) => setLinkTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Status</label>
                  <select
                    value={bannerStatus}
                    onChange={(e) => setBannerStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#570013] text-white font-bold rounded-xl shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
