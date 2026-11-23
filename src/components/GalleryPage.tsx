import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import {
  PHOTO_ALBUMS,
  PHOTO_GALLERY_ITEMS,
  VIDEO_CATEGORIES,
  VIDEO_GALLERY_ITEMS,
  type GalleryPhotoItem,
  type PhotoAlbumCategory,
  type VideoGalleryCategory,
} from '../data/nisargaContent';
import { HospitalImage } from './HospitalImage';

export type GalleryViewMode = 'all' | 'photos' | 'videos';

interface GalleryPageProps {
  initialMode?: GalleryViewMode;
  onBackHome: () => void;
  onBookVisit: () => void;
}

export function GalleryPage({
  initialMode = 'all',
  onBackHome,
  onBookVisit,
}: GalleryPageProps) {
  const [viewMode, setViewMode] = useState<GalleryViewMode>(initialMode);
  const [selectedPhotoAlbum, setSelectedPhotoAlbum] = useState<PhotoAlbumCategory>('All Photos');
  const [selectedVideoCategory, setSelectedVideoCategory] =
    useState<VideoGalleryCategory>('All Videos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode]);

  const filteredPhotos = useMemo(() => {
    if (selectedPhotoAlbum === 'All Photos') return PHOTO_GALLERY_ITEMS;
    return PHOTO_GALLERY_ITEMS.filter((item) => item.album === selectedPhotoAlbum);
  }, [selectedPhotoAlbum]);

  const filteredVideos = useMemo(() => {
    if (selectedVideoCategory === 'All Videos') return VIDEO_GALLERY_ITEMS;
    return VIDEO_GALLERY_ITEMS.filter((item) => item.category === selectedVideoCategory);
  }, [selectedVideoCategory]);

  const activeLightboxPhoto: GalleryPhotoItem | null =
    lightboxIndex !== null && filteredPhotos[lightboxIndex] ? filteredPhotos[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredPhotos.length,
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + filteredPhotos.length) % filteredPhotos.length,
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filteredPhotos.length]);

  const handlePhotoDropdownChange = (album: PhotoAlbumCategory) => {
    setSelectedPhotoAlbum(album);
    setLightboxIndex(null);
    if (viewMode === 'videos') {
      setViewMode('photos');
    }
  };

  const handleVideoDropdownChange = (category: VideoGalleryCategory) => {
    setSelectedVideoCategory(category);
    if (viewMode === 'photos') {
      setViewMode('videos');
    }
  };

  const showPhotos = viewMode === 'all' || viewMode === 'photos';
  const showVideos = viewMode === 'all' || viewMode === 'videos';

  return (
    <div className="bg-[#FAF9F6] text-[#14221D]">
      {/* Page Hero & Dual Dropdown Controls */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-10 lg:pt-14 lg:pb-12 border-b border-[#E2E7E2]">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5D55] hover:text-[#135D43] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Nisarga Care Home
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-medium text-[#135D43]">
              Nisarga Care Bengaluru · Official Campus Media
            </p>
            <h1
              className="font-display text-3xl lg:text-5xl font-semibold text-[#14221D] tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Photo & Video Gallery
            </h1>
            <p className="text-sm sm:text-base text-[#4A5D55] leading-relaxed max-w-2xl">
              Explore photographs and campus tour videos from Nisarga Care in Horamavu, Bengaluru—our
              assisted living spaces, dementia memory care routines, physiotherapy studio, and daily
              life.
            </p>
          </div>

          <div className="lg:col-span-5 flex lg:justify-end">
            <div className="inline-flex items-center gap-1 p-1 bg-[#EDF1EE] rounded-lg border border-[#DCE3DD]">
              {(
                [
                  { id: 'all', label: 'All Media' },
                  { id: 'photos', label: 'Photo Gallery' },
                  { id: 'videos', label: 'Video Gallery' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === tab.id
                      ? 'bg-white text-[#135D43] shadow-sm'
                      : 'text-[#4A5D55] hover:text-[#14221D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dedicated Two Dropdown Boxes: Photo Gallery & Video Gallery */}
        <div className="mt-8 bg-white border border-[#E2E7E2] rounded-2xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Dropdown 1: Photo Gallery */}
          <div className="space-y-2">
            <label
              htmlFor="gallery-photo-dropdown"
              className="flex items-center justify-between text-xs font-semibold text-[#14221D]"
            >
              <span className="inline-flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#135D43]" />
                Photo Gallery Album
              </span>
              <span className="font-mono tabular-nums text-[#4A5D55] font-normal">
                {filteredPhotos.length} photos
              </span>
            </label>
            <select
              id="gallery-photo-dropdown"
              value={selectedPhotoAlbum}
              onChange={(e) => handlePhotoDropdownChange(e.target.value as PhotoAlbumCategory)}
              className="w-full px-3.5 py-2.5 text-sm text-[#14221D] bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43] cursor-pointer"
            >
              {PHOTO_ALBUMS.map((album) => (
                <option key={album} value={album}>
                  {album}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Video Gallery */}
          <div className="space-y-2">
            <label
              htmlFor="gallery-video-dropdown"
              className="flex items-center justify-between text-xs font-semibold text-[#14221D]"
            >
              <span className="inline-flex items-center gap-2">
                <Film className="w-4 h-4 text-[#135D43]" />
                Video Gallery Category
              </span>
              <span className="font-mono tabular-nums text-[#4A5D55] font-normal">
                {filteredVideos.length} videos
              </span>
            </label>
            <select
              id="gallery-video-dropdown"
              value={selectedVideoCategory}
              onChange={(e) => handleVideoDropdownChange(e.target.value as VideoGalleryCategory)}
              className="w-full px-3.5 py-2.5 text-sm text-[#14221D] bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43] cursor-pointer"
            >
              {VIDEO_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* PHOTO GALLERY SECTION */}
      {showPhotos && (
        <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#135D43]">
                Photo Gallery · {selectedPhotoAlbum}
              </p>
              <h2 className="font-display text-2xl lg:text-3xl font-semibold text-[#14221D]">
                Life & Facilities at Nisarga Care
              </h2>
            </div>
            <p className="text-xs text-[#4A5D55]">
              Click any photograph to view full size
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo, index) => (
              <article
                key={photo.id}
                className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden flex flex-col group"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="aspect-[4/3] bg-[#EAF1EC] overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#135D43] cursor-pointer"
                >
                  <HospitalImage
                    src={photo.src}
                    alt={photo.title}
                    fallbackTitle={photo.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </button>
                <div className="p-5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-[#4A5D55]">
                      <span className="text-[#135D43] font-medium">{photo.album}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{photo.sourceLabel}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#14221D] leading-snug">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-[#4A5D55] leading-relaxed">{photo.caption}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* VIDEO GALLERY SECTION */}
      {showVideos && (
        <section
          className={`py-12 lg:py-16 ${
            showPhotos ? 'bg-[#F1F4F1] border-t border-[#E2E7E2]' : 'bg-[#FAF9F6]'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#135D43]">
                  Video Gallery · {selectedVideoCategory}
                </p>
                <h2 className="font-display text-2xl lg:text-3xl font-semibold text-[#14221D]">
                  Campus Walkthroughs & Care Stories
                </h2>
              </div>
              <span className="text-xs text-[#4A5D55] font-mono tabular-nums">
                {filteredVideos.length} videos from nisargacare.com
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredVideos.map((video) => (
                <article
                  key={video.id}
                  className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-video bg-[#14221D] relative overflow-hidden">
                    {video.kind === 'youtube' ? (
                      <iframe
                        src={video.url}
                        title={video.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain bg-[#14221D]"
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support inline video playback.
                      </video>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-xs text-[#4A5D55]">
                        <span className="text-[#135D43] font-medium">{video.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{video.sourceLabel}</span>
                      </div>
                      <h3 className="font-display text-xl font-semibold text-[#14221D] leading-snug">
                        {video.title}
                      </h3>
                      <p className="text-sm text-[#4A5D55] leading-relaxed">{video.description}</p>
                    </div>

                    <div className="pt-3 border-t border-[#EDF1EE] flex items-center justify-between text-xs">
                      <span className="text-[#4A5D55]">
                        {video.kind === 'youtube' ? 'YouTube Video' : 'Campus MP4 Recording'}
                      </span>
                      <a
                        href={video.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#135D43] hover:underline"
                      >
                        Open Original
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quiet Campus Visit CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="bg-white border border-[#E2E7E2] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-[#14221D]">
              Experience our Horamavu sanctuary in person
            </h2>
            <p className="text-sm text-[#4A5D55]">
              Schedule a guided family tour to inspect suites, meet our geriatric doctors and
              nurses, and review personalized care plans.
            </p>
          </div>
          <button
            type="button"
            onClick={onBookVisit}
            className="px-6 py-3 text-sm font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Schedule Campus Tour
          </button>
        </div>
      </section>

      {/* Lightbox Modal for Photos */}
      {activeLightboxPhoto && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxPhoto.title}
          className="fixed inset-0 z-50 bg-[#0D1814]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#2A3F36]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#E2E7E2] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-[#135D43] font-medium">
                  {activeLightboxPhoto.album} ·{' '}
                  <span className="font-mono tabular-nums text-[#4A5D55]">
                    {lightboxIndex + 1} / {filteredPhotos.length}
                  </span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-semibold text-[#14221D] truncate">
                  {activeLightboxPhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close photo preview"
                className="p-2 rounded-lg text-[#4A5D55] hover:bg-[#F1F4F1] hover:text-[#14221D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-[#14221D] flex items-center justify-center max-h-[68vh]">
              <img
                src={activeLightboxPhoto.src}
                alt={activeLightboxPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[68vh] w-auto object-contain"
              />
              {filteredPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-[#14221D] hover:bg-white shadow-md cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-[#14221D] hover:bg-white shadow-md cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="px-5 py-4 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5D55]">
              <span>{activeLightboxPhoto.caption}</span>
              <span className="font-mono">{activeLightboxPhoto.sourceLabel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
