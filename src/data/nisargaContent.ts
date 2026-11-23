import type { BlogCategory, CareUnit } from '../types/hospital';

export const NISARGA_CONTACT = {
  brandName: 'Nisarga Care',
  legalName: 'Nisarga Health Care Group',
  established: 'September 1989',
  yearsOfCare: '37+ Years',
  addressLine1: 'No. 216, Horamavu Main Road, Near Banaswadi',
  addressLine2: 'Bengaluru, Karnataka – 560043',
  fullAddress: 'No. 216, Horamavu Main Road, Near Banaswadi, Bengaluru, Karnataka – 560043',
  phoneDisplay: '+91 97312 56246',
  phoneRaw: '+919731256246',
  whatsappDigits: '919731256246',
  whatsappUrl:
    'https://wa.me/919731256246?text=Hello%20Nisarga%20Care%2C%20I%20would%20like%20to%20inquire%20about%20elder%20care%2C%20admissions%2C%20or%20booking%20an%20appointment.',
  email: 'nisargacare1@gmail.com',
  website: 'https://www.nisargacare.com',
  visitingHours: 'Mon – Sat · 10:00 AM – 6:00 PM',
  sundayNote: 'Sundays by prior appointment',
} as const;

export const HOSPITAL_IMAGES = {
  logoTheme: '/src/assets/images/nisarga_logo_theme.png',
  logoLight: '/src/assets/images/nisarga_logo_light.png',
  heroCampus: '/src/assets/images/hero_nisarga_campus_1795434940908.jpg',
  rehabPhysio: '/src/assets/images/care_rehab_physio_1795434940685.jpg',
  suitesRoom: '/src/assets/images/care_suites_room_1795434939120.jpg',
  nursingWellness: '/src/assets/images/care_nursing_wellness_1795434941552.jpg',
  nutritionGarden: '/src/assets/images/care_nutrition_garden_1795434941638.jpg',
  unitGeriatric: '/src/assets/images/unit_geriatric_supervision_1795436621001.jpg',
  unitPostOp: '/src/assets/images/unit_postop_bedridden_1795436620766.jpg',
  unitPalliative: '/src/assets/images/unit_palliative_respite_1795436620868.jpg',
  unitPsychiatric: '/src/assets/images/unit_psychiatric_rehab_1795436620937.jpg',
  docKulkarni: '/src/assets/images/doc_raghavendra_kulkarni_1795436620801.jpg',
  docSundaram: '/src/assets/images/doc_kavitha_sundaram_1795436619990.jpg',
  docDeshmukh: '/src/assets/images/doc_arjun_deshmukh_1795436621370.jpg',
  docIyer: '/src/assets/images/doc_meenakshi_iyer_1795436619164.jpg',
  docMenon: '/src/assets/images/doc_prakash_menon_1795436620771.jpg',
} as const;

export interface CareUnitItem {
  number: string;
  id: CareUnit;
  title: string;
  summary: string;
  highlights: string[];
  leadDoctor: string;
  featured?: boolean;
  image: string;
}

export const CARE_UNIT_DETAILS: CareUnitItem[] = [
  {
    number: '01',
    id: "Dementia & Alzheimer's Care",
    title: "Dementia & Alzheimer's Memory Care",
    summary:
      'Structured daily memory routines, gentle orientation cues, safe half-acre walking gardens, and round-the-clock dementia-trained caregivers who preserve dignity at every stage.',
    highlights: [
      'Supervised wandering-safe garden walkways',
      'Cognitive engagement, music & reminiscence sessions',
      '24/7 behavioral observation & medication compliance',
    ],
    leadDoctor: 'Dr. Kavitha Sundaram',
    featured: true,
    image: HOSPITAL_IMAGES.nursingWellness,
  },
  {
    number: '02',
    id: "Parkinson's & Stroke Rehab",
    title: "Parkinson's & Stroke Rehabilitation",
    summary:
      'Goal-driven neurological rehabilitation combining daily guided physiotherapy, gait & balance training, swallowing support, and adaptive assisted living for sustained functional recovery.',
    highlights: [
      'Individualized neuro-physiotherapy plans',
      'Parallel-bar mobility, strength & tremor support',
      'Weekly progress logs shared with families',
    ],
    leadDoctor: 'Dr. Arjun Deshmukh',
    featured: true,
    image: HOSPITAL_IMAGES.rehabPhysio,
  },
  {
    number: '03',
    id: '24/7 Geriatric & Nursing Care',
    title: '24/7 Geriatric & Nursing Supervision',
    summary:
      'Continuous clinical oversight by qualified nurses and daily doctor rounds for seniors managing diabetes, hypertension, cardiac weakness, and age-related frailty.',
    highlights: [
      'Daily vitals, blood sugar & medication charts',
      'In-house oxygen support & emergency response',
      '24/7 ambulance coordination with partner hospitals',
    ],
    leadDoctor: 'Dr. Raghavendra Kulkarni',
    image: HOSPITAL_IMAGES.unitGeriatric,
  },
  {
    number: '04',
    id: 'Post-Operative & Bedridden Care',
    title: 'Post-Operative & Bedridden Care',
    summary:
      'Dedicated clinical recovery following orthopaedic, cardiac, or neurological hospital discharge, including pressure-sore prevention, sterile dressings, and assisted feeding.',
    highlights: [
      'Ryle’s tube, catheter & tracheostomy nursing',
      '2-hourly positioning & complete hygiene care',
      'Hospital-grade adjustable beds & air mattresses',
    ],
    leadDoctor: 'Dr. Meenakshi Iyer',
    image: HOSPITAL_IMAGES.unitPostOp,
  },
  {
    number: '05',
    id: 'Palliative & Respite Care',
    title: 'Palliative Comfort & Short-Term Respite',
    summary:
      'Compassionate pain and symptom management focused on comfort and emotional peace, alongside flexible short-term respite stays when family caregivers need restorative time.',
    highlights: [
      'Gentle pain relief & emotional family counseling',
      'Short-stay respite options from 1 week onward',
      'Peaceful private rooms with family visiting access',
    ],
    leadDoctor: 'Dr. Meenakshi Iyer',
    image: HOSPITAL_IMAGES.unitPalliative,
  },
  {
    number: '06',
    id: 'Psychiatric Rehabilitation',
    title: 'Psychiatric & Mental Health Rehabilitation',
    summary:
      'Calm, stigma-free residential psychiatric rehabilitation guided by visiting psychiatrists, clinical psychologists, and social workers to restore stability and daily independence.',
    highlights: [
      'Individual therapy & medication supervision',
      'Structured yoga, meditation & social activities',
      'Family education and reintegration planning',
    ],
    leadDoctor: 'Dr. Prakash Menon',
    image: HOSPITAL_IMAGES.unitPsychiatric,
  },
];

export interface SpecialistProfile {
  name: string;
  qualification: string;
  role: string;
  department: CareUnit;
  schedule: string;
  focus: string;
  photo: string;
}

export const SPECIALISTS: SpecialistProfile[] = [
  {
    name: 'Dr. Raghavendra Kulkarni',
    qualification: 'MBBS, MD (Internal Medicine)',
    role: 'Chief Geriatric Physician',
    department: '24/7 Geriatric & Nursing Care',
    schedule: 'Daily Rounds · 9:30 AM – 1:00 PM',
    focus: 'Chronic geriatric disease management, hypertension, diabetes & inpatient stabilization.',
    photo: HOSPITAL_IMAGES.docKulkarni,
  },
  {
    name: 'Dr. Kavitha Sundaram',
    qualification: 'MBBS, DPM (Psychiatry)',
    role: 'Consultant Neuropsychiatrist',
    department: "Dementia & Alzheimer's Care",
    schedule: 'Mon, Wed, Fri · 10:30 AM – 2:30 PM',
    focus: 'Alzheimer’s disease, vascular dementia, memory decline & geriatric behavioral care.',
    photo: HOSPITAL_IMAGES.docSundaram,
  },
  {
    name: 'Dr. Arjun Deshmukh',
    qualification: 'MPT (Neurological Rehabilitation)',
    role: 'Lead Physiotherapist',
    department: "Parkinson's & Stroke Rehab",
    schedule: 'Mon – Sat · 9:30 AM – 5:00 PM',
    focus: 'Post-stroke paralysis recovery, Parkinson’s gait training & post-fracture mobility.',
    photo: HOSPITAL_IMAGES.docDeshmukh,
  },
  {
    name: 'Dr. Meenakshi Iyer',
    qualification: 'MBBS, Fellowship in Palliative Medicine',
    role: 'Palliative & Post-Op Care Lead',
    department: 'Palliative & Respite Care',
    schedule: 'Tue, Thu, Sat · 11:00 AM – 4:00 PM',
    focus: 'Post-surgical recovery, wound care, pain management & compassionate end-of-life care.',
    photo: HOSPITAL_IMAGES.docIyer,
  },
  {
    name: 'Dr. Prakash Menon',
    qualification: 'M.Phil (Clinical Psychology)',
    role: 'Clinical Psychologist & Rehab Lead',
    department: 'Psychiatric Rehabilitation',
    schedule: 'Mon – Fri · 11:00 AM – 4:30 PM',
    focus: 'Mental health rehabilitation, family counseling, mindfulness & psychosocial wellness.',
    photo: HOSPITAL_IMAGES.docMenon,
  },
];

export const CAMPUS_HIGHLIGHTS = [
  {
    title: 'Sunlit Furnished Suites',
    meta: 'Private & Shared · Garden View',
    description:
      'Airy, well-ventilated rooms with adjustable hospital & comfort beds, crisp daily linens, ceiling fans, and wall-mounted LCD televisions designed to feel like a second home.',
    image: HOSPITAL_IMAGES.suitesRoom,
  },
  {
    title: '24/7 Clinical Nursing Stations',
    meta: 'Oxygen Support · Emergency Ready',
    description:
      'Round-the-clock trained nurses, daily doctor visits, continuous vital-sign charting, and immediate ambulance coordination for uninterrupted peace of mind.',
    image: HOSPITAL_IMAGES.nursingWellness,
  },
  {
    title: 'Guided Neuro-Physiotherapy',
    meta: 'Daily Sessions · Mobility Studio',
    description:
      'Dedicated rehabilitation space overlooking tropical greenery for stroke paralysis recovery, Parkinson’s balance therapy, and post-surgical mobilization.',
    image: HOSPITAL_IMAGES.rehabPhysio,
  },
  {
    title: 'Half-Acre Green Sanctuary & Yoga',
    meta: 'Morning Yoga · Home-Cooked Diet',
    description:
      'Shaded walking paths, gentle morning seated yoga, indoor games, and fresh home-cooked Indian meals—from morning bed tea to customized therapeutic dinners.',
    image: HOSPITAL_IMAGES.nutritionGarden,
  },
] as const;

export const DAILY_NUTRITION_RHYTHM = [
  { time: '06:30 AM', label: 'Morning Bed Tea / Filter Coffee & Vitals Check' },
  { time: '08:00 AM', label: 'Warm South & North Indian Breakfast · Diabetic / Soft Options' },
  { time: '10:30 AM', label: 'Physiotherapy, Garden Walk, Yoga & Nutritious Mid-Morning Beverage' },
  { time: '01:00 PM', label: 'Fresh Home-Cooked Lunch · Assisted & Tube Feeding When Prescribed' },
  { time: '04:30 PM', label: 'Evening Tea, Warm Snacks & Indoor Social Activities' },
  { time: '07:30 PM', label: 'Light Therapeutic Dinner, Night Medications & Nurse Rounding' },
] as const;

export const FAMILY_TESTIMONIALS = [
  {
    quote:
      'After my father’s ischemic stroke, bringing him home alone was overwhelming. Within six weeks at Nisarga Care, daily physiotherapy and attentive 24/7 nurses helped him walk along the garden veranda again.',
    author: 'Suresh Narayanan',
    relation: 'Son of Stroke Rehab Resident · Indiranagar, Bengaluru',
    outcome: 'Regained assisted walking mobility in 6 weeks',
  },
  {
    quote:
      'Finding dignified Alzheimer’s care in Bengaluru felt daunting until we visited the Horamavu campus. The green surroundings, home-style food, and transparent daily vitals updates gave our entire family peace of mind.',
    author: 'Ananya Deshpande',
    relation: 'Daughter of Memory Care Resident · Whitefield, Bengaluru',
    outcome: 'Consistent sleep routine & calm daily engagement',
  },
  {
    quote:
      'We used Nisarga Care for 3 weeks of post-hip-replacement care before transitioning my mother home. Wound hygiene, pain management, and warm staff care exceeded every hospital expectation.',
    author: 'Vikramaditya Rao',
    relation: 'Family Member · Banaswadi, Bengaluru',
    outcome: 'Zero complications through full post-op discharge',
  },
] as const;

export const APPOINTMENT_TIME_SLOTS = [
  '10:00 AM',
  '10:45 AM',
  '11:30 AM',
  '12:15 PM',
  '02:30 PM',
  '03:30 PM',
  '04:30 PM',
  '05:15 PM',
] as const;

/* ============================================================================
 * Photo Gallery & Video Gallery Assets Fetched from nisargacare.com
 * ========================================================================== */
export type PhotoAlbumCategory =
  | 'All Photos'
  | 'Campus & Facilities'
  | 'Elder Care & Daily Living'
  | 'Rehabilitation & Clinical Units';

export interface GalleryPhotoItem {
  id: string;
  title: string;
  caption: string;
  album: Exclude<PhotoAlbumCategory, 'All Photos'>;
  src: string;
  sourceLabel: string;
}

export const PHOTO_ALBUMS: PhotoAlbumCategory[] = [
  'All Photos',
  'Campus & Facilities',
  'Elder Care & Daily Living',
  'Rehabilitation & Clinical Units',
];

export const PHOTO_GALLERY_ITEMS: GalleryPhotoItem[] = [
  {
    id: 'gal-1',
    title: 'Nisarga Care Horamavu Campus Grounds',
    caption: 'Original campus photography from Nisarga Care Bengaluru showcasing senior residential spaces.',
    album: 'Campus & Facilities',
    src: '/src/assets/images/gallery/nisarga_gal_1.jpg',
    sourceLabel: 'nisargacare.com/gallery',
  },
  {
    id: 'gal-2',
    title: 'Assisted Living & Resident Courtyard',
    caption: 'Peaceful residential care environment designed for daily comfort and mobility.',
    album: 'Campus & Facilities',
    src: '/src/assets/images/gallery/nisarga_gal_2.jpg',
    sourceLabel: 'nisargacare.com/gallery',
  },
  {
    id: 'gal-3',
    title: 'Arogyadhama Banaswadi Care Centre',
    caption: 'Nisarga Care & Arogyadhama geriatric residential facility near Horamavu–Banaswadi.',
    album: 'Campus & Facilities',
    src: '/src/assets/images/gallery/nisarga_gal_3.jpg',
    sourceLabel: 'nisargacare.com/gallery',
  },
  {
    id: 'gal-4',
    title: 'Specialized Dementia & Rehabilitation Services',
    caption: 'Clinical rehabilitation and geriatric care highlight from Nisarga Care Bengaluru.',
    album: 'Rehabilitation & Clinical Units',
    src: '/src/assets/images/gallery/nisarga_gal_4.jpg',
    sourceLabel: 'nisargacare.com',
  },
  {
    id: 'gal-5',
    title: 'Senior Living & Caregiver Engagement',
    caption: 'Dedicated day-to-day caregiving and companionship at our Bengaluru home.',
    album: 'Elder Care & Daily Living',
    src: '/src/assets/images/gallery/nisarga_gal_5.jpg',
    sourceLabel: 'nisargacare.com',
  },
  {
    id: 'gal-6',
    title: 'Daily Nursing & Supportive Care',
    caption: 'Attentive nursing supervision, medication adherence, and resident wellbeing.',
    album: 'Elder Care & Daily Living',
    src: '/src/assets/images/gallery/nisarga_gal_6.jpg',
    sourceLabel: 'nisargacare.com',
  },
  {
    id: 'gal-7',
    title: 'Luxury Assisted Living & Senior Comfort',
    caption: 'Clean, airy accommodation and compassionate assistance for senior residents.',
    album: 'Campus & Facilities',
    src: '/src/assets/images/gallery/nisarga_gal_7.jpg',
    sourceLabel: 'nisargacare.com',
  },
  {
    id: 'gal-8',
    title: 'Rehabilitation & Community Living',
    caption: 'Structured group activities and neurological recovery support in Horamavu.',
    album: 'Rehabilitation & Clinical Units',
    src: '/src/assets/images/gallery/nisarga_gal_8.jpg',
    sourceLabel: 'nisargacare.com',
  },
  {
    id: 'gal-9',
    title: 'Sunlit Half-Acre Tropical Garden Walkways',
    caption: 'Wandering-safe shaded walking paths surrounded by Bengaluru greenery.',
    album: 'Campus & Facilities',
    src: HOSPITAL_IMAGES.heroCampus,
    sourceLabel: 'Campus View',
  },
  {
    id: 'gal-10',
    title: 'Neuro-Physiotherapy & Mobility Studio',
    caption: 'Guided stroke and Parkinson’s gait rehabilitation overlooking tropical greenery.',
    album: 'Rehabilitation & Clinical Units',
    src: HOSPITAL_IMAGES.rehabPhysio,
    sourceLabel: 'Clinical Unit',
  },
  {
    id: 'gal-11',
    title: 'Private Garden-View Geriatric Suite',
    caption: 'Furnished wooden adjustable bed, crisp linens, and tranquil garden ventilation.',
    album: 'Campus & Facilities',
    src: HOSPITAL_IMAGES.suitesRoom,
    sourceLabel: 'Suites',
  },
  {
    id: 'gal-12',
    title: 'Morning Seated Yoga & Mindful Breathing',
    caption: 'Daily wellness sessions held in our shaded garden courtyard.',
    album: 'Elder Care & Daily Living',
    src: HOSPITAL_IMAGES.nutritionGarden,
    sourceLabel: 'Wellness',
  },
];

export type VideoGalleryCategory =
  | 'All Videos'
  | 'Campus & Facility Tours'
  | 'Dementia & Neurological Rehab'
  | 'Community & Care Highlights';

export interface GalleryVideoItem {
  id: string;
  title: string;
  description: string;
  category: Exclude<VideoGalleryCategory, 'All Videos'>;
  kind: 'youtube' | 'mp4';
  url: string;
  externalUrl: string;
  sourceLabel: string;
}

export const VIDEO_CATEGORIES: VideoGalleryCategory[] = [
  'All Videos',
  'Campus & Facility Tours',
  'Dementia & Neurological Rehab',
  'Community & Care Highlights',
];

export const VIDEO_GALLERY_ITEMS: GalleryVideoItem[] = [
  {
    id: 'vid-yt-1',
    title: 'Nisarga Care Bengaluru — Campus & Assisted Living Tour',
    description:
      'Walkthrough of Nisarga Care’s Horamavu–Banaswadi residential care home, nursing care stations, and green campus environment.',
    category: 'Campus & Facility Tours',
    kind: 'youtube',
    url: 'https://www.youtube.com/embed/cHdN_DVRiZQ',
    externalUrl: 'https://www.youtube.com/watch?v=cHdN_DVRiZQ',
    sourceLabel: 'nisargacare.com/video-gallery',
  },
  {
    id: 'vid-yt-2',
    title: '24/7 Elder Care, Daily Routine & Nursing Support',
    description:
      'Inside look at round-the-clock senior citizen nursing, nutrition, and attentive geriatric care at Nisarga Care.',
    category: 'Campus & Facility Tours',
    kind: 'youtube',
    url: 'https://www.youtube.com/embed/S37TjxZnTog',
    externalUrl: 'https://www.youtube.com/watch?v=S37TjxZnTog',
    sourceLabel: 'nisargacare.com/video-gallery',
  },
  {
    id: 'vid-yt-3',
    title: 'Memory Care, Stroke Recovery & Rehabilitation Overview',
    description:
      'How Nisarga Care supports elders with Dementia, Alzheimer’s, Parkinson’s, and post-hospital neurological rehabilitation.',
    category: 'Dementia & Neurological Rehab',
    kind: 'youtube',
    url: 'https://www.youtube.com/embed/xV6nAv08ixs',
    externalUrl: 'https://www.youtube.com/watch?v=xV6nAv08ixs',
    sourceLabel: 'nisargacare.com/video-gallery',
  },
  {
    id: 'vid-mp4-1',
    title: 'Dementia Rehabilitation Center for the Elderly in Bengaluru',
    description:
      'Official facility video from Nisarga Care highlighting dementia rehabilitation and residential senior care programs.',
    category: 'Dementia & Neurological Rehab',
    kind: 'mp4',
    url: 'https://nisargacare.com/wp-content/uploads/2026/05/Good-Best-Dementia-Rehabilitation-Center-for-the-Elderly-in-Bangalore-Rehabilitation-centers-fo.mp4',
    externalUrl:
      'https://nisargacare.com/wp-content/uploads/2026/05/Good-Best-Dementia-Rehabilitation-Center-for-the-Elderly-in-Bangalore-Rehabilitation-centers-fo.mp4',
    sourceLabel: 'nisargacare.com/video-gallery',
  },
  {
    id: 'vid-mp4-2',
    title: 'Neurological & Mental Health Rehabilitation in Karnataka',
    description:
      'Overview of structured inpatient rehabilitation for stroke, psychiatric recovery, and elderly care at Nisarga Care.',
    category: 'Dementia & Neurological Rehab',
    kind: 'mp4',
    url: 'https://nisargacare.com/wp-content/uploads/2026/03/Good-rehabilitation-in-karnataka.-rehabilitation-center-in-bangalore-www.nisargacare.com-men.mp4',
    externalUrl:
      'https://nisargacare.com/wp-content/uploads/2026/03/Good-rehabilitation-in-karnataka.-rehabilitation-center-in-bangalore-www.nisargacare.com-men.mp4',
    sourceLabel: 'nisargacare.com/video-gallery',
  },
  {
    id: 'vid-mp4-3',
    title: 'Nisarga Care Community & Caregiver Highlights',
    description:
      'Moments from Nisarga Care’s Bengaluru community highlighting compassionate caregiving and resident life.',
    category: 'Community & Care Highlights',
    kind: 'mp4',
    url: 'https://nisargacare.com/wp-content/uploads/2024/04/IOB-wanteddd.mp4',
    externalUrl: 'https://nisargacare.com/wp-content/uploads/2024/04/IOB-wanteddd.mp4',
    sourceLabel: 'nisargacare.com/video-gallery',
  },
];

/* ============================================================================
 * Blog Cover Image Presets & Curated Seed Articles (from nisargacare.com/blog)
 * ========================================================================== */
export const BLOG_COVER_PRESETS = [
  { label: 'Horamavu Green Campus', url: HOSPITAL_IMAGES.heroCampus },
  { label: 'Memory Care & Nursing', url: HOSPITAL_IMAGES.nursingWellness },
  { label: 'Stroke & Neuro Physiotherapy', url: HOSPITAL_IMAGES.rehabPhysio },
  { label: 'Sunlit Private Suite', url: HOSPITAL_IMAGES.suitesRoom },
  { label: 'Geriatric Doctor Rounds', url: HOSPITAL_IMAGES.unitGeriatric },
  { label: 'Post-Operative Suite', url: HOSPITAL_IMAGES.unitPostOp },
  { label: 'Palliative & Respite Care', url: HOSPITAL_IMAGES.unitPalliative },
  { label: 'Psychiatric Counseling Lounge', url: HOSPITAL_IMAGES.unitPsychiatric },
  { label: 'Morning Yoga & Garden', url: HOSPITAL_IMAGES.nutritionGarden },
] as const;

export interface SeedBlogArticle {
  title: string;
  slug: string;
  category: BlogCategory;
  excerpt: string;
  content: string;
  coverImage: string;
  authorName: string;
  readTimeMinutes: number;
  publishedAt: string;
}

export const SEED_BLOG_ARTICLES: SeedBlogArticle[] = [
  {
    title: 'Rehabilitation Center vs. Nursing Home: Choosing the Right Care in Bengaluru',
    slug: 'rehabilitation-center-vs-nursing-home-bengaluru',
    category: 'Rehabilitation & Mobility',
    excerpt:
      'Understand when a recovering senior benefits most from focused neuro-rehabilitation versus ongoing 24/7 nursing home supervision—and how Nisarga Care bridges both.',
    content: `Families across Horamavu, Banaswadi, Kalyan Nagar, and Whitefield often ask whether their loved one needs a dedicated rehabilitation center or a long-term nursing home after a hospital discharge.

A rehabilitation center focuses on active functional recovery following stroke, fracture surgery, Parkinson's progression, or prolonged hospitalization. Daily physiotherapy, balance retraining, occupational exercises, and speech or swallowing support are structured around measurable mobility milestones.

A nursing home, by contrast, provides continuous 24/7 clinical supervision, medication management, hygiene support, and chronic illness monitoring for elders who require dependable day-to-day assistance.

At Nisarga Care in Bengaluru, both models operate under one serene roof. Residents recovering from hip surgery or ischemic stroke work daily with our physiotherapists while benefiting from round-the-clock nursing charts, daily doctor rounds, oxygen readiness, and freshly prepared home-cooked Indian meals tailored to their clinical diet.`,
    coverImage: HOSPITAL_IMAGES.rehabPhysio,
    authorName: 'Dr. Arjun Deshmukh',
    readTimeMinutes: 4,
    publishedAt: '2026-09-27',
  },
  {
    title: 'Structured Daily Routines for Dementia & Alzheimer’s Patients at Home and in Care',
    slug: 'structured-daily-routines-dementia-alzheimers-care',
    category: 'Dementia & Memory Care',
    excerpt:
      'Predictable morning rhythms, wandering-safe garden spaces, and gentle orientation cues meaningfully reduce sundowning and anxiety in elders living with memory loss.',
    content: `Caring for a parent or spouse with Alzheimer's disease or vascular dementia requires patience, clinical consistency, and an environment that feels familiar rather than institutional.

Consistent wake times, sunlit breakfasts, supervised mid-morning garden walks, and calm evening transitions anchor the body's circadian rhythm. When seniors know what comes next—without feeling rushed—agitation and late-afternoon sundowning episodes decrease noticeably.

At Nisarga Care's Dementia & Memory Care Unit, trained caregivers guide each resident through gentle cognitive exercises, music reminiscence, and assisted personal hygiene inside our half-acre walled Bengaluru garden campus. Families remain connected through regular clinical updates and open visiting hours from Monday to Saturday.`,
    coverImage: HOSPITAL_IMAGES.nursingWellness,
    authorName: 'Dr. Kavitha Sundaram',
    readTimeMinutes: 5,
    publishedAt: '2026-10-18',
  },
  {
    title: 'Caretaker vs. Caregiver: Understanding Professional Elder Support',
    slug: 'caretaker-vs-caregiver-understanding-elder-support',
    category: 'Senior Living & Nutrition',
    excerpt:
      'While often used interchangeably, clinical caregiving goes far beyond basic housekeeping—combining vitals monitoring, safe mobility transfers, and emotional dignity.',
    content: `When families begin searching for elder care near Banaswadi and Horamavu, the terms "caretaker" and "caregiver" are often used interchangeably. Yet the difference is vital when caring for seniors living with chronic conditions, bedridden recovery, or memory loss.

A caretaker typically looks after household upkeep and basic supervision. A trained clinical caregiver—working alongside qualified nurses and visiting physicians—is trained in pressure-sore prevention, safe bed-to-wheelchair transfers, diabetic meal observation, medication adherence, and compassionate communication.

Since 1989, Nisarga Health Care Group has invested in training caregivers who treat every resident with warmth and respect while maintaining strict hospital-grade clinical protocols.`,
    coverImage: HOSPITAL_IMAGES.unitGeriatric,
    authorName: 'Dr. Raghavendra Kulkarni',
    readTimeMinutes: 4,
    publishedAt: '2026-08-10',
  },
  {
    title: 'Psychiatric & Mental Health Rehabilitation: Restoring Confidence and Independence',
    slug: 'psychiatric-mental-health-rehabilitation-bengaluru',
    category: 'Mental Health & Wellness',
    excerpt:
      'How structured residential psychiatric rehabilitation, clinical counseling, yoga, and family partnership help individuals rebuild daily stability without stigma.',
    content: `Derived from the Latin root "habilitas," rehabilitation is about restoring capability, dignity, and confidence. For individuals recovering from long-standing psychiatric or neurological conditions, an immediate return home after acute treatment can feel overwhelming for both patient and family.

Residential psychiatric rehabilitation bridges that transition safely. Guided by visiting psychiatrists, clinical psychologists, and social workers, residents follow balanced daily routines that blend supervised medication, one-on-one counseling, morning yoga and meditation, and gentle social engagement.

Our goal at Nisarga Care is sustainable recovery and thoughtful family reintegration—supported in a calm, green Bengaluru setting free of stigma.`,
    coverImage: HOSPITAL_IMAGES.unitPsychiatric,
    authorName: 'Dr. Prakash Menon',
    readTimeMinutes: 4,
    publishedAt: '2026-06-17',
  },
];
