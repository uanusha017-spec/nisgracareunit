import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Clock, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import {
  CAMPUS_HIGHLIGHTS,
  CARE_UNIT_DETAILS,
  DAILY_NUTRITION_RHYTHM,
  FAMILY_TESTIMONIALS,
  HOSPITAL_IMAGES,
  NISARGA_CONTACT,
  SPECIALISTS,
} from '../data/nisargaContent';
import type { CareUnit } from '../types/hospital';
import { AppointmentBookingCard } from './AppointmentBookingCard';
import { BlogsPage } from './BlogsPage';
import { GalleryPage, type GalleryViewMode } from './GalleryPage';
import { HospitalImage } from './HospitalImage';

export type PublicPage = 'home' | 'gallery' | 'blogs';

interface PublicWebsiteProps {
  activePage: PublicPage;
  galleryMode: GalleryViewMode;
  onNavigatePage: (page: PublicPage, galleryMode?: GalleryViewMode) => void;
  onOpenPortal: (initialTab?: 'overview' | 'blogs') => void;
  selectedDepartment?: CareUnit;
  selectedDoctor?: string;
  onSelectForBooking: (department: CareUnit, doctor?: string) => void;
}

export function PublicWebsite({
  activePage,
  galleryMode,
  onNavigatePage,
  onOpenPortal,
  selectedDepartment,
  selectedDoctor,
  onSelectForBooking,
}: PublicWebsiteProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [galleryMenuOpen, setGalleryMenuOpen] = useState(false);
  const galleryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (galleryMenuRef.current && !galleryMenuRef.current.contains(e.target as Node)) {
        setGalleryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navigateToHomeSection = (sectionId: string) => {
    setMobileNavOpen(false);
    setGalleryMenuOpen(false);
    if (activePage !== 'home') {
      onNavigatePage('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToBooking = (dept?: CareUnit, doctor?: string) => {
    if (dept) {
      onSelectForBooking(dept, doctor);
    }
    navigateToHomeSection('book-appointment');
  };

  const openGallery = (mode: GalleryViewMode) => {
    setGalleryMenuOpen(false);
    setMobileNavOpen(false);
    onNavigatePage('gallery', mode);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openBlogs = () => {
    setGalleryMenuOpen(false);
    setMobileNavOpen(false);
    onNavigatePage('blogs');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openHomeTop = () => {
    setGalleryMenuOpen(false);
    setMobileNavOpen(false);
    onNavigatePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#14221D]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E2E7E2]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single brand logo element */}
          <button
            type="button"
            onClick={openHomeTop}
            aria-label="Nisarga Care Home"
            className="inline-flex items-center whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#135D43] rounded cursor-pointer"
          >
            <img
              src={HOSPITAL_IMAGES.logoTheme}
              alt="Nisarga Care"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </button>

          {/* Zone 2: 5 concise single-line nav links (with Gallery dropdown) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5D55]"
          >
            <button
              type="button"
              onClick={() => navigateToHomeSection('care-units')}
              className="hover:text-[#14221D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Care Units
            </button>

            <div ref={galleryMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setGalleryMenuOpen((prev) => !prev)}
                aria-expanded={galleryMenuOpen}
                aria-haspopup="menu"
                className={`inline-flex items-center gap-1 hover:text-[#14221D] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activePage === 'gallery' ? 'text-[#135D43] font-semibold' : ''
                }`}
              >
                Gallery
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${galleryMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {galleryMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2.5 w-48 bg-white border border-[#DCE3DD] rounded-xl shadow-lg py-1.5 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openGallery('photos')}
                    className="w-full text-left px-4 py-2 text-sm text-[#14221D] hover:bg-[#F1F4F1] hover:text-[#135D43] transition-colors cursor-pointer"
                  >
                    Photo Gallery
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openGallery('videos')}
                    className="w-full text-left px-4 py-2 text-sm text-[#14221D] hover:bg-[#F1F4F1] hover:text-[#135D43] transition-colors cursor-pointer"
                  >
                    Video Gallery
                  </button>
                  <div className="my-1 border-t border-[#EDF1EE]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openGallery('all')}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#4A5D55] hover:bg-[#F1F4F1] hover:text-[#135D43] transition-colors cursor-pointer"
                  >
                    View All Media
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigateToHomeSection('specialists')}
              className="hover:text-[#14221D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Specialists
            </button>

            <button
              type="button"
              onClick={openBlogs}
              className={`hover:text-[#14221D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'blogs' ? 'text-[#135D43] font-semibold' : ''
              }`}
            >
              Blogs
            </button>

            <button
              type="button"
              onClick={() => onOpenPortal()}
              className="hover:text-[#14221D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Hospital Portal
            </button>
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollToBooking()}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Book Appointment
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-[#14221D] hover:bg-[#EDF1EE] cursor-pointer"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#E2E7E2] bg-white px-6 py-4 space-y-2.5 text-sm font-medium">
            <button
              type="button"
              onClick={() => navigateToHomeSection('care-units')}
              className="block w-full text-left py-1.5 text-[#14221D] cursor-pointer"
            >
              Care Units
            </button>
            <button
              type="button"
              onClick={() => openGallery('photos')}
              className="block w-full text-left py-1.5 text-[#14221D] cursor-pointer"
            >
              Photo Gallery
            </button>
            <button
              type="button"
              onClick={() => openGallery('videos')}
              className="block w-full text-left py-1.5 text-[#14221D] cursor-pointer"
            >
              Video Gallery
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('specialists')}
              className="block w-full text-left py-1.5 text-[#14221D] cursor-pointer"
            >
              Specialists
            </button>
            <button
              type="button"
              onClick={openBlogs}
              className="block w-full text-left py-1.5 text-[#14221D] cursor-pointer"
            >
              Blogs
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onOpenPortal();
              }}
              className="block w-full text-left py-1.5 text-[#135D43] font-semibold cursor-pointer"
            >
              Hospital Portal
            </button>
            <button
              type="button"
              onClick={() => scrollToBooking()}
              className="w-full py-2.5 text-center text-white bg-[#135D43] rounded-lg cursor-pointer"
            >
              Book Appointment
            </button>
          </div>
        )}
      </header>

      {activePage === 'gallery' ? (
        <main id="top">
          <GalleryPage
            initialMode={galleryMode}
            onBackHome={openHomeTop}
            onBookVisit={() => scrollToBooking()}
          />
        </main>
      ) : activePage === 'blogs' ? (
        <main id="top">
          <BlogsPage
            onBackHome={openHomeTop}
            onBookAppointment={() => scrollToBooking()}
            onOpenAdminBlogs={() => onOpenPortal('blogs')}
          />
        </main>
      ) : (
      <main id="top">
        {/* Hero Split — items-stretch for symmetric desktop visual balance */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-10 lg:pt-16 lg:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#4A5D55]">
                <span>Nisarga Health Care Group</span>
                <span aria-hidden="true">·</span>
                <span>Horamavu, Bengaluru</span>
                <span aria-hidden="true">·</span>
                <span>Established {NISARGA_CONTACT.established}</span>
              </div>

              <h1
                className="font-display font-semibold text-[#14221D] tracking-tight leading-[1.12] max-w-2xl"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', textWrap: 'balance' }}
              >
                Dignified geriatric hospital care in a peaceful Bengaluru sanctuary.
              </h1>

              <p className="text-base text-[#4A5D55] leading-relaxed max-w-xl">
                Since 1989, Nisarga Care has combined 24/7 clinical nursing, daily doctor rounds,
                memory care, and neuro-physiotherapy inside a serene half-acre green campus designed
                as a comforting second home for elders and recovering patients.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToBooking()}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Schedule Campus Visit
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPortal()}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-[#14221D] bg-white border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Patient & Admin Portal
                </button>
              </div>

              <div className="pt-4 border-t border-[#E2E7E2] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#4A5D55]">
                <a
                  href={`tel:${NISARGA_CONTACT.phoneRaw}`}
                  className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[#14221D] hover:text-[#135D43]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#135D43]" />
                  {NISARGA_CONTACT.phoneDisplay}
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#135D43]" />
                  {NISARGA_CONTACT.visitingHours}
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[340px] lg:min-h-[480px] rounded-2xl overflow-hidden border border-[#E2E7E2] bg-[#EAF1EC]">
                <HospitalImage
                  src={HOSPITAL_IMAGES.heroCampus}
                  alt="Nisarga Care half-acre green geriatric hospital and assisted living sanctuary in Horamavu, Bengaluru"
                  fallbackTitle="Nisarga Care Bengaluru Campus"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Full-width 4-column Proof Strip below Hero */}
          <div className="mt-10 bg-white border border-[#E2E7E2] rounded-2xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E7E2]">
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-semibold text-[#135D43]">1989</div>
              <div className="text-sm font-medium text-[#14221D] mt-1">37+ Years in Bengaluru</div>
              <div className="text-xs text-[#4A5D55] mt-0.5">Trusted geriatric & rehab heritage</div>
            </div>
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-semibold text-[#135D43]">24/7</div>
              <div className="text-sm font-medium text-[#14221D] mt-1">Clinical Nursing & Oxygen</div>
              <div className="text-xs text-[#4A5D55] mt-0.5">Daily doctor rounds & ambulance tie-up</div>
            </div>
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-semibold text-[#135D43]">0.5 Acre</div>
              <div className="text-sm font-medium text-[#14221D] mt-1">Green Walking Campus</div>
              <div className="text-xs text-[#4A5D55] mt-0.5">Airy sunlit rooms & shaded gardens</div>
            </div>
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-semibold text-[#135D43]">6 Units</div>
              <div className="text-sm font-medium text-[#14221D] mt-1">Specialized Care Programs</div>
              <div className="text-xs text-[#4A5D55] mt-0.5">Dementia, Stroke, Post-Op & Palliative</div>
            </div>
          </div>
        </section>

        {/* Specialized Clinical & Care Units — Asymmetric Editorial Bento Grid */}
        <section id="care-units" className="max-w-7xl mx-auto px-6 py-16 lg:py-20 border-t border-[#E6EBE6]">
          <div className="max-w-2xl space-y-3 mb-12">
            <p className="text-xs font-medium text-[#135D43]">Specialized Clinical Care Units</p>
            <h2
              className="font-display text-3xl lg:text-4xl font-semibold text-[#14221D] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Structured medical supervision tailored to elder and recovery needs
            </h2>
            <p className="text-sm text-[#4A5D55] leading-relaxed">
              Every resident receives an individualized care plan combining round-the-clock nursing,
              physician oversight, mobility rehabilitation, and nutritious home-style meals.
            </p>
          </div>

          {/* Featured 2-column visual care units */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {CARE_UNIT_DETAILS.slice(0, 2).map((unit) => (
              <article
                key={unit.id}
                className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden flex flex-col"
              >
                {unit.image && (
                  <div className="aspect-[16/10] bg-[#EAF1EC] overflow-hidden">
                    <HospitalImage
                      src={unit.image}
                      alt={unit.title}
                      fallbackTitle={unit.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 md:p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="text-xs text-[#4A5D55]">
                      <span className="font-mono tabular-nums text-[#135D43] font-semibold">
                        {unit.number}.
                      </span>{' '}
                      Lead: {unit.leadDoctor}
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[#14221D]">
                      {unit.title}
                    </h3>
                    <p className="text-sm text-[#4A5D55] leading-relaxed">{unit.summary}</p>
                    <ul className="pt-2 space-y-1.5 text-sm text-[#2A3F36]">
                      {unit.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-[#135D43] font-semibold">
                            —
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#EDF1EE] flex items-center justify-between">
                    <span className="text-xs text-[#4A5D55]">Short-term & long-term stays</span>
                    <button
                      type="button"
                      onClick={() => scrollToBooking(unit.id, unit.leadDoctor)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#135D43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Book Assessment
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Remaining 4 specialized units (03–06) with full clinical unit photography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CARE_UNIT_DETAILS.slice(2).map((unit) => (
              <article
                key={unit.id}
                className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10] bg-[#EAF1EC] overflow-hidden">
                  <HospitalImage
                    src={unit.image}
                    alt={unit.title}
                    fallbackTitle={unit.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-xs text-[#4A5D55]">
                      <span>
                        <span className="font-mono tabular-nums text-[#135D43] font-semibold">
                          {unit.number}.
                        </span>{' '}
                        Lead: {unit.leadDoctor}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#14221D]">
                      {unit.title}
                    </h3>
                    <p className="text-sm text-[#4A5D55] leading-relaxed">{unit.summary}</p>
                    <ul className="pt-1 space-y-1.5 text-sm text-[#2A3F36]">
                      {unit.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-[#135D43] font-semibold">
                            —
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#EDF1EE] flex items-center justify-between">
                    <span className="text-xs text-[#4A5D55]">24/7 Clinical Care</span>
                    <button
                      type="button"
                      onClick={() => scrollToBooking(unit.id, unit.leadDoctor)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#135D43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Schedule Consultation
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Campus Living, Rooms & Daily Therapeutic Rhythm */}
        <section id="campus" className="bg-[#F1F4F1] border-y border-[#E2E7E2] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 space-y-3">
                <p className="text-xs font-medium text-[#135D43]">
                  Campus, Suites & Holistic Daily Living
                </p>
                <h2
                  className="font-display text-3xl lg:text-4xl font-semibold text-[#14221D] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  A second home built for clinical safety, greenery, and warmth
                </h2>
              </div>
              <p className="lg:col-span-5 text-sm text-[#4A5D55] leading-relaxed">
                Located off Horamavu Main Road near Banaswadi, our tranquil campus replaces cold
                hospital wards with ventilated sunlit rooms, tropical gardens, home-cooked senior
                meals, and gentle morning yoga.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CAMPUS_HIGHLIGHTS.map((item) => (
                <article
                  key={item.title}
                  className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#EAF1EC] overflow-hidden">
                    <HospitalImage
                      src={item.image}
                      alt={item.title}
                      fallbackTitle={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 space-y-2 flex-1">
                    <p className="text-xs text-[#4A5D55]">{item.meta}</p>
                    <h3 className="font-display text-lg font-semibold text-[#14221D]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#4A5D55] leading-relaxed">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Daily Nutrition & Wellness Rhythm */}
            <div className="bg-white border border-[#E2E7E2] rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EDF1EE]">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#14221D]">
                    Daily Care, Nutrition & Activity Rhythm
                  </h3>
                  <p className="text-sm text-[#4A5D55] mt-1">
                    Fresh, hygienic home-cooked Indian meals and scheduled clinical checks every day.
                  </p>
                </div>
                <span className="text-xs text-[#4A5D55]">
                  Customized diabetic, renal, soft & tube-fed plans available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 pt-6">
                {DAILY_NUTRITION_RHYTHM.map((step) => (
                  <div key={step.time} className="space-y-1">
                    <div className="font-mono tabular-nums text-xs font-semibold text-[#135D43]">
                      {step.time}
                    </div>
                    <p className="text-sm text-[#2A3F36] leading-snug">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Multidisciplinary Specialists & Adjacent Family Outcomes */}
        <section id="specialists" className="max-w-7xl mx-auto px-6 py-16 lg:py-20 space-y-16">
          <div className="space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium text-[#135D43]">In-House & Visiting Clinical Team</p>
              <h2
                className="font-display text-3xl lg:text-4xl font-semibold text-[#14221D] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Dedicated geriatric doctors, therapists, and 24/7 nurses
              </h2>
            </div>

            <div className="bg-white border border-[#E2E7E2] rounded-2xl divide-y divide-[#EDF1EE]">
              {SPECIALISTS.map((doc) => (
                <div
                  key={doc.name}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-[#FAF9F6]/70 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-5 max-w-2xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#DCE3DD] bg-[#EAF1EC] shrink-0">
                      <HospitalImage
                        src={doc.photo}
                        alt={`${doc.name} — ${doc.role}`}
                        fallbackTitle={doc.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <h3 className="font-display text-lg font-semibold text-[#14221D]">
                          {doc.name}
                        </h3>
                        <span aria-hidden="true" className="text-[#94A39B]">·</span>
                        <span className="text-xs text-[#4A5D55]">{doc.qualification}</span>
                      </div>
                      <p className="text-xs font-medium text-[#135D43]">
                        {doc.role} · {doc.department}
                      </p>
                      <p className="text-sm text-[#4A5D55] leading-relaxed">{doc.focus}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-5 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-[#4A5D55]">
                      {doc.schedule}
                    </span>
                    <button
                      type="button"
                      onClick={() => scrollToBooking(doc.department, doc.name)}
                      className="px-4 py-2 text-xs font-semibold text-[#135D43] bg-[#F1F4F1] hover:bg-[#135D43] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Book Consultation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim-to-Proof Adjacent Family Outcomes */}
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-medium text-[#135D43]">Family Experiences in Bengaluru</p>
              <h2 className="font-display text-2xl lg:text-3xl font-semibold text-[#14221D]">
                Trusted by families across Indiranagar, Banaswadi, and Whitefield
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FAMILY_TESTIMONIALS.map((item) => (
                <blockquote
                  key={item.author}
                  className="bg-white border border-[#E2E7E2] rounded-2xl p-6 flex flex-col justify-between space-y-5"
                >
                  <p className="text-sm text-[#2A3F36] leading-relaxed">“{item.quote}”</p>
                  <footer className="pt-4 border-t border-[#EDF1EE] space-y-1">
                    <div className="text-xs font-semibold text-[#135D43]">{item.outcome}</div>
                    <div className="text-sm font-semibold text-[#14221D]">{item.author}</div>
                    <div className="text-xs text-[#4A5D55]">{item.relation}</div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Appointment Scheduling & Contact Section */}
        <section
          id="book-appointment"
          className="bg-[#F1F4F1] border-t border-[#E2E7E2] py-16 lg:py-20"
        >
          <div id="contact" className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-[#135D43]">
                    Admissions, Appointments & Campus Visits
                  </p>
                  <h2
                    className="font-display text-3xl lg:text-4xl font-semibold text-[#14221D] tracking-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    Visit Nisarga Care or speak with our Bengaluru care team
                  </h2>
                  <p className="text-sm text-[#4A5D55] leading-relaxed">
                    Whether you are planning long-term memory care, post-operative nursing, or a
                    short respite stay, we welcome families to tour our Horamavu campus and meet our
                    clinical team in person.
                  </p>
                </div>

                <div className="bg-white border border-[#E2E7E2] rounded-2xl p-6 space-y-5 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#135D43] mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#14221D]">Campus Address</div>
                      <p className="text-[#4A5D55] mt-0.5">
                        {NISARGA_CONTACT.addressLine1}
                        <br />
                        {NISARGA_CONTACT.addressLine2}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#135D43] mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#14221D]">24/7 Helpline & WhatsApp</div>
                      <a
                        href={`tel:${NISARGA_CONTACT.phoneRaw}`}
                        className="font-mono tabular-nums text-[#135D43] font-medium hover:underline block mt-0.5"
                      >
                        {NISARGA_CONTACT.phoneDisplay}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#135D43] mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#14221D]">Email</div>
                      <a
                        href={`mailto:${NISARGA_CONTACT.email}`}
                        className="text-[#4A5D55] hover:text-[#135D43] block mt-0.5"
                      >
                        {NISARGA_CONTACT.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#135D43] mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#14221D]">Visiting Hours</div>
                      <p className="text-[#4A5D55] mt-0.5">
                        {NISARGA_CONTACT.visitingHours}
                        <br />
                        {NISARGA_CONTACT.sundayNote}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <AppointmentBookingCard
                  defaultDepartment={selectedDepartment}
                  defaultDoctor={selectedDoctor}
                  onSuccessNavigatePortal={() => onOpenPortal()}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      )}

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#14221D] text-[#D8E2DC]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <img
              src={HOSPITAL_IMAGES.logoLight}
              alt="Nisarga Care"
              referrerPolicy="no-referrer"
              className="h-9 w-auto object-contain"
            />
            <p className="text-xs text-[#A3B5AC] leading-relaxed max-w-sm">
              {NISARGA_CONTACT.legalName} · Established {NISARGA_CONTACT.established}. Geriatric
              hospital, assisted living, memory care, and rehabilitation center in Bengaluru.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2 text-xs">
            <div className="font-semibold text-white mb-2">Navigation</div>
            <button
              type="button"
              onClick={() => navigateToHomeSection('care-units')}
              className="block hover:text-white transition-colors cursor-pointer"
            >
              Specialized Care Units
            </button>
            <button
              type="button"
              onClick={() => openGallery('photos')}
              className="block hover:text-white transition-colors cursor-pointer"
            >
              Photo & Video Gallery
            </button>
            <button
              type="button"
              onClick={() => navigateToHomeSection('specialists')}
              className="block hover:text-white transition-colors cursor-pointer"
            >
              Clinical Team
            </button>
            <button
              type="button"
              onClick={openBlogs}
              className="block hover:text-white transition-colors cursor-pointer"
            >
              Care Blogs & Insights
            </button>
            <button
              type="button"
              onClick={() => onOpenPortal()}
              className="block hover:text-white transition-colors cursor-pointer"
            >
              Patient & Admin Portal
            </button>
          </div>

          <div className="md:col-span-4 space-y-2 text-xs">
            <div className="font-semibold text-white mb-2">Bengaluru Campus</div>
            <p className="text-[#A3B5AC]">{NISARGA_CONTACT.fullAddress}</p>
            <p className="font-mono tabular-nums text-white">{NISARGA_CONTACT.phoneDisplay}</p>
            <p className="text-[#A3B5AC]">{NISARGA_CONTACT.email}</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8FA399]">
            <span>© {new Date().getFullYear()} Nisarga Health Care Group, Bengaluru. All rights reserved.</span>
            <span>24/7 Geriatric Nursing & Rehabilitation Care</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
