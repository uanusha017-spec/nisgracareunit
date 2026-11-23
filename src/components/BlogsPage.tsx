import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Edit3, Search, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_BLOG_ARTICLES } from '../data/nisargaContent';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from '../types/hospital';
import { HospitalImage } from './HospitalImage';

interface BlogsPageProps {
  onBackHome: () => void;
  onBookAppointment: () => void;
  onOpenAdminBlogs: () => void;
}

interface DisplayBlog {
  id: string;
  title: string;
  slug: string;
  category: BlogCategory;
  excerpt: string;
  content: string;
  coverImage: string;
  authorName: string;
  readTimeMinutes: number;
  publishedAt: string;
  isLiveFirestore: boolean;
}

export function BlogsPage({
  onBackHome,
  onBookAppointment,
  onOpenAdminBlogs,
}: BlogsPageProps) {
  const { isAdmin } = useAuth();
  const [liveBlogs, setLiveBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogCategory>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeArticle, setActiveArticle] = useState<DisplayBlog | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'blogs'), where('status', '==', 'published'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: BlogPost[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BlogPost, 'id'>),
        }));
        items.sort((a, b) => {
          const dateCmp = (b.publishedAt || '').localeCompare(a.publishedAt || '');
          if (dateCmp !== 0) return dateCmp;
          return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
        });
        setLiveBlogs(items);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, 'blogs');
        } catch {
          // Graceful fallback to editorial library if read is blocked
        }
      },
    );

    return () => unsub();
  }, []);

  const articles: DisplayBlog[] = useMemo(() => {
    if (liveBlogs.length > 0) {
      return liveBlogs.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        category: b.category,
        excerpt: b.excerpt,
        content: b.content,
        coverImage: b.coverImage,
        authorName: b.authorName,
        readTimeMinutes: b.readTimeMinutes,
        publishedAt: b.publishedAt,
        isLiveFirestore: true,
      }));
    }

    return SEED_BLOG_ARTICLES.map((seed) => ({
      id: `seed-${seed.slug}`,
      ...seed,
      isLiveFirestore: false,
    }));
  }, [liveBlogs]);

  const filteredArticles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return articles.filter((art) => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const matchesQuery =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.authorName.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [articles, selectedCategory, searchTerm]);

  const leadArticle = filteredArticles[0] ?? null;
  const remainingArticles = filteredArticles.slice(1);

  return (
    <div className="bg-[#FAF9F6] text-[#14221D]">
      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-10 lg:pt-14 lg:pb-12 border-b border-[#E2E7E2]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5D55] hover:text-[#135D43] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Nisarga Care Home
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminBlogs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Manage & Publish Blogs
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-medium text-[#135D43]">
              Nisarga Care Clinical Journal & Family Guides
            </p>
            <h1
              className="font-display text-3xl lg:text-5xl font-semibold text-[#14221D] tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Elder Care & Rehabilitation Blogs
            </h1>
            <p className="text-sm sm:text-base text-[#4A5D55] leading-relaxed max-w-2xl">
              Evidence-based guidance from Nisarga Care’s geriatric physicians, neuro-rehabilitation
              specialists, and caregivers in Bengaluru.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#4A5D55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dementia, stroke rehab, nutrition, doctors..."
                aria-label="Search blog articles"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>
          </div>
        </div>

        {/* Interactive Category Segmented Filter */}
        <div className="mt-7 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['All', ...BLOG_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#135D43] text-white border-[#135D43]'
                  : 'bg-white text-[#4A5D55] border-[#DCE3DD] hover:border-[#135D43] hover:text-[#14221D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Feed */}
      <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16 space-y-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E2E7E2] rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white border border-[#E2E7E2] rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#4A5D55] mx-auto" />
            <h2 className="font-display text-xl font-semibold text-[#14221D]">
              No matching articles found
            </h2>
            <p className="text-sm text-[#4A5D55] max-w-md mx-auto">
              Try clearing your search term or selecting a different care category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-xs font-semibold text-[#135D43] border border-[#135D43] rounded-lg hover:bg-[#EAF2ED] cursor-pointer"
            >
              Show All Articles
            </button>
          </div>
        ) : (
          <>
            {/* Featured Lead Article */}
            {leadArticle && (
              <article className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-6 aspect-[16/10] lg:aspect-auto lg:min-h-[340px] bg-[#EAF1EC] overflow-hidden">
                  <HospitalImage
                    src={leadArticle.coverImage}
                    alt={leadArticle.title}
                    fallbackTitle={leadArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D55]">
                      <span className="font-semibold text-[#135D43]">{leadArticle.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{leadArticle.publishedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {leadArticle.readTimeMinutes} min read
                      </span>
                    </div>
                    <h2
                      className="font-display text-2xl lg:text-3xl font-semibold text-[#14221D] leading-snug"
                      style={{ textWrap: 'balance' }}
                    >
                      {leadArticle.title}
                    </h2>
                    <p className="text-sm text-[#4A5D55] leading-relaxed">{leadArticle.excerpt}</p>
                  </div>

                  <div className="pt-4 border-t border-[#EDF1EE] flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 text-xs text-[#4A5D55]">
                      <User className="w-3.5 h-3.5 text-[#135D43]" />
                      <span className="font-medium text-[#14221D]">{leadArticle.authorName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveArticle(leadArticle)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#135D43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Read Full Article
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Remaining Articles Grid */}
            {remainingArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingArticles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-white border border-[#E2E7E2] rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[16/10] bg-[#EAF1EC] overflow-hidden">
                      <HospitalImage
                        src={art.coverImage}
                        alt={art.title}
                        fallbackTitle={art.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#4A5D55]">
                          <span className="font-semibold text-[#135D43]">{art.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{art.publishedAt}</span>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-[#14221D] leading-snug">
                          {art.title}
                        </h3>
                        <p className="text-sm text-[#4A5D55] leading-relaxed line-clamp-3">
                          {art.excerpt}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#EDF1EE] flex items-center justify-between gap-3">
                        <span className="text-xs text-[#4A5D55] truncate">
                          {art.authorName} ·{' '}
                          <span className="font-mono tabular-nums">{art.readTimeMinutes}m</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveArticle(art)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#135D43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Read
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Full Article Reader Modal */}
      {activeArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeArticle.title}
          className="fixed inset-0 z-50 bg-[#0D1814]/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setActiveArticle(null)}
        >
          <article
            className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#DCE3DD] my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E2E7E2] flex items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-[#4A5D55] truncate">
                <span className="font-semibold text-[#135D43]">{activeArticle.category}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">{activeArticle.publishedAt}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  {activeArticle.readTimeMinutes} min read
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close article reader"
                className="p-2 rounded-lg text-[#4A5D55] hover:bg-[#F1F4F1] hover:text-[#14221D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="aspect-[16/9] bg-[#EAF1EC] overflow-hidden">
                <HospitalImage
                  src={activeArticle.coverImage}
                  alt={activeArticle.title}
                  fallbackTitle={activeArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#14221D] leading-tight">
                    {activeArticle.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A5D55] pb-4 border-b border-[#EDF1EE]">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#135D43]" />
                      By <strong className="text-[#14221D]">{activeArticle.authorName}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[#135D43]" />
                      {activeArticle.publishedAt}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-sm sm:text-base text-[#2A3F36] leading-relaxed">
                  {activeArticle.content
                    .split(/\n\s*\n/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                </div>

                <div className="pt-6 border-t border-[#E2E7E2] flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-[#4A5D55]">
                    Have questions for our clinical team in Horamavu, Bengaluru?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveArticle(null);
                      onBookAppointment();
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Book Clinical Consultation
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
