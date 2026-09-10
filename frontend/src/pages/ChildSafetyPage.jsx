import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChildSafetyPage() {
  const navigate = useNavigate()
  const safetyEmail = import.meta.env.VITE_CHILD_SAFETY_EMAIL || 'safety@agarwalbiodata.com'
  const lastUpdated = 'September 10, 2026'

  return (
    <div className="bg-[#fbf9f5] min-h-screen flex flex-col text-[#1b1c1a] font-body">
      
      <main className="flex-grow pt-6 pb-12 px-4 overflow-x-hidden">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-amber-200/60 p-5 sm:p-8">
          
          <div className="border-b border-amber-200 pb-4 mb-6 text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#570013] mb-2">
              Child Safety Standards
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            
            <section className="space-y-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#570013] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">verified_user</span>
                1. Our Commitment
              </h2>
              <p>
                Agarwal Biodata is fundamentally committed to the safety and well-being of all individuals, especially children. Our platform is strictly designed and intended for use by adults aged 18 and older. 
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#570013] flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[20px]">block</span>
                2. Zero Tolerance for CSAE
              </h2>
              <p className="font-semibold text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs sm:text-sm">
                Agarwal Biodata has a strict, zero-tolerance policy for child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM).
              </p>
              <p>
                Users must not upload, share, request, distribute, or promote CSAM or any sexually exploitative content involving minors. The sexual exploitation of minors is strictly prohibited.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#570013] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">gavel</span>
                3. Prohibited Content and Behaviour
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Grooming, solicitation, or trafficking of minors.</li>
                <li>Inappropriate or sexual communication involving minors.</li>
                <li>Sharing, requesting, or promoting CSAM.</li>
                <li>Any form of sexual exploitation or abuse directed at individuals under 18.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#570013] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">report</span>
                4. Reporting Child Safety Concerns
              </h2>
              <p>
                We empower our community to help keep the platform safe. If you encounter any user or content that violates our child safety standards, you can report it directly within the application:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Navigate to the user's profile and select "Report User" from the action menu.</li>
                <li>Choose a child-safety-related reason from the report categories and submit.</li>
              </ul>
              <p className="font-semibold text-[#570013] text-xs">
                Child safety reports are treated with the highest priority (CRITICAL) by our moderation team.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#570013] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">admin_panel_settings</span>
                5. Moderation & Enforcement
              </h2>
              <p>
                Reported accounts and content are promptly investigated. If an investigation confirms a violation:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The violating content will be immediately removed.</li>
                <li>The offending account will be suspended or permanently banned.</li>
                <li>Serious cases will be escalated to appropriate legal authorities where legally required.</li>
              </ul>
            </section>

            <section className="space-y-3 bg-amber-50 p-4 sm:p-5 rounded-xl border border-amber-200 mt-6">
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#570013] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">contact_support</span>
                6. Child Safety Contact
              </h2>
              <p className="text-xs sm:text-sm">
                If you have urgent child safety concerns or questions regarding our policies, contact our dedicated Child Safety team directly:
              </p>
              <p className="font-bold text-base text-[#570013] break-all">
                <a href={`mailto:${safetyEmail}`} className="hover:underline flex items-center gap-2 inline-flex">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  {safetyEmail}
                </a>
              </p>
            </section>

            <div className="pt-6 text-center">
               <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-2 rounded-lg bg-[#570013] hover:bg-[#72001a] text-white text-sm font-bold shadow-md active:scale-95 transition"
                >
                  Return to App
                </button>
            </div>

          </div>
        </div>
      </main>

    </div>
  )
}
