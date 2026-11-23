import React, { useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  BookOpen,
  Check,
  Database,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { BLOG_COVER_PRESETS, HOSPITAL_IMAGES, SEED_BLOG_ARTICLES } from '../data/nisargaContent';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BLOG_CATEGORIES,
  sanitizeText,
  SCHEMA_LIMITS,
  slugifyTitle,
  type BlogCategory,
  type BlogPost,
  type BlogStatus,
} from '../types/hospital';
import { HospitalImage } from './HospitalImage';

interface BlogManagerPanelProps {
  blogs: BlogPost[];
  loading: boolean;
  authorUid: string;
  defaultAuthorName: string;
  onNotify: (banner: { kind: 'ok' | 'err'; text: string }) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BlogManagerPanel({
  blogs,
  loading,
  authorUid,
  defaultAuthorName,
  onNotify,
}: BlogManagerPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all');
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [seedingBlogs, setSeedingBlogs] = useState(false);

  const counts = useMemo(() => {
    const published = blogs.filter((b) => b.status === 'published').length;
    const drafts = blogs.filter((b) => b.status === 'draft').length;
    return { total: blogs.length, published, drafts };
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [blogs, search, statusFilter]);

  const handleTogglePublish = async (blog: BlogPost) => {
    const nextStatus: BlogStatus = blog.status === 'published' ? 'draft' : 'published';
    const path = `blogs/${blog.id}`;
    try {
      await updateDoc(doc(db, 'blogs', blog.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      onNotify({
        kind: 'ok',
        text:
          nextStatus === 'published'
            ? `Published "${blog.title}" to the live Blogs page.`
            : `Moved "${blog.title}" back to drafts.`,
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch {
        onNotify({ kind: 'err', text: 'Could not update blog publish status.' });
      }
    }
  };

  const handleDeleteBlog = async (blog: BlogPost) => {
    const path = `blogs/${blog.id}`;
    try {
      await deleteDoc(doc(db, 'blogs', blog.id));
      setConfirmDeleteId(null);
      onNotify({ kind: 'ok', text: `Deleted blog post "${blog.title}".` });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch {
        onNotify({ kind: 'err', text: 'Could not delete blog post.' });
      }
    }
  };

  const handleSeedBlogs = async () => {
    if (seedingBlogs) return;
    setSeedingBlogs(true);
    try {
      for (const seed of SEED_BLOG_ARTICLES) {
        await addDoc(collection(db, 'blogs'), {
          title: sanitizeText(seed.title, SCHEMA_LIMITS.BLOG_TITLE_MAX),
          slug: sanitizeText(seed.slug, SCHEMA_LIMITS.BLOG_SLUG_MAX),
          category: seed.category,
          excerpt: sanitizeText(seed.excerpt, SCHEMA_LIMITS.BLOG_EXCERPT_MAX),
          content: sanitizeText(seed.content, SCHEMA_LIMITS.BLOG_CONTENT_MAX),
          coverImage: sanitizeText(seed.coverImage, SCHEMA_LIMITS.BLOG_COVER_MAX),
          authorName: sanitizeText(seed.authorName, SCHEMA_LIMITS.DISPLAY_NAME_MAX),
          authorUid,
          readTimeMinutes: seed.readTimeMinutes,
          status: 'published',
          publishedAt: seed.publishedAt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onNotify({
        kind: 'ok',
        text: `Published ${SEED_BLOG_ARTICLES.length} Nisarga Care clinical blog posts to Firestore.`,
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'blogs');
      } catch {
        onNotify({ kind: 'err', text: 'Could not seed Nisarga Care blog posts.' });
      }
    } finally {
      setSeedingBlogs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="bg-white border border-[#E2E7E2] rounded-xl grid grid-cols-3 divide-x divide-[#E2E7E2]">
        <div className="p-5">
          <div className="text-xs text-[#4A5D55]">Total Articles</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#14221D] mt-1">
            {counts.total}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs text-[#4A5D55]">Published Live</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#15803D] mt-1">
            {counts.published}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs text-[#4A5D55]">Drafts</div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-[#B45309] mt-1">
            {counts.drafts}
          </div>
        </div>
      </div>

      {/* Main CRUD Table Card */}
      <section className="bg-white border border-[#E2E7E2] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#E2E7E2] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#4A5D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blog title, category, author..."
              aria-label="Search blog posts"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#F1F4F1] rounded-lg">
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-[#14221D] shadow-sm'
                      : 'text-[#4A5D55] hover:text-[#14221D]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingBlog(null);
                setShowEditor(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Blog Post
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-[#F4F7F5] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-7 h-7 text-[#4A5D55] mx-auto" />
            <p className="text-sm font-medium text-[#14221D]">
              {blogs.length === 0
                ? 'No blog articles stored in Firestore yet'
                : 'No blog posts match your filter'}
            </p>
            <p className="text-xs text-[#4A5D55] max-w-md mx-auto">
              Create an original elder care article or publish the 4 Nisarga Care starter articles
              to test editing, publishing, and deleting right away.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditingBlog(null);
                  setShowEditor(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Write New Blog
              </button>
              {blogs.length === 0 && (
                <button
                  type="button"
                  onClick={() => void handleSeedBlogs()}
                  disabled={seedingBlogs}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#14221D] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] disabled:opacity-50 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#135D43]" />
                  {seedingBlogs ? 'Publishing Samples...' : 'Publish Sample Nisarga Blogs'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E2] bg-[#FAF9F6] text-xs font-medium text-[#4A5D55]">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1EE] text-sm">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-[#FAF9F6]/70">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#EAF1EC] border border-[#E2E7E2] shrink-0">
                          <HospitalImage
                            src={blog.coverImage}
                            alt={blog.title}
                            fallbackTitle={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#14221D] truncate">{blog.title}</div>
                          <div className="text-xs font-mono text-[#4A5D55] truncate">
                            /{blog.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#2A3F36] whitespace-nowrap">
                      {blog.category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#4A5D55] whitespace-nowrap">
                      {blog.authorName}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-[#4A5D55] whitespace-nowrap">
                      {blog.publishedAt}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <span
                        className={
                          blog.status === 'published'
                            ? 'text-[#15803D] font-semibold'
                            : 'text-[#B45309] font-semibold'
                        }
                      >
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleTogglePublish(blog)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#135D43] bg-[#EAF2ED] hover:bg-[#135D43] hover:text-white rounded-md transition-colors cursor-pointer"
                        >
                          {blog.status === 'published' ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Publish
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBlog(blog);
                            setShowEditor(true);
                          }}
                          aria-label={`Edit ${blog.title}`}
                          className="p-1.5 text-[#4A5D55] hover:text-[#14221D] hover:bg-[#F1F4F1] rounded-md cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === blog.id ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteBlog(blog)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-md cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(blog.id)}
                            aria-label={`Delete ${blog.title}`}
                            className="p-1.5 text-[#4A5D55] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Blog Create / Edit Modal */}
      {showEditor && (
        <BlogEditorModal
          initialBlog={editingBlog}
          authorUid={authorUid}
          defaultAuthorName={defaultAuthorName}
          onClose={() => {
            setShowEditor(false);
            setEditingBlog(null);
          }}
          onSaved={(msg) => {
            setShowEditor(false);
            setEditingBlog(null);
            onNotify({ kind: 'ok', text: msg });
          }}
          onError={(msg) => onNotify({ kind: 'err', text: msg })}
        />
      )}
    </div>
  );
}

interface BlogEditorModalProps {
  initialBlog: BlogPost | null;
  authorUid: string;
  defaultAuthorName: string;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

function BlogEditorModal({
  initialBlog,
  authorUid,
  defaultAuthorName,
  onClose,
  onSaved,
  onError,
}: BlogEditorModalProps) {
  const [title, setTitle] = useState(initialBlog?.title ?? '');
  const [slug, setSlug] = useState(initialBlog?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialBlog));
  const [category, setCategory] = useState<BlogCategory>(
    initialBlog?.category ?? 'Dementia & Memory Care',
  );
  const [authorName, setAuthorName] = useState(initialBlog?.authorName ?? defaultAuthorName);
  const [publishedAt, setPublishedAt] = useState(initialBlog?.publishedAt ?? todayIso());
  const [readTimeMinutes, setReadTimeMinutes] = useState(
    String(initialBlog?.readTimeMinutes ?? 4),
  );
  const [status, setStatus] = useState<BlogStatus>(initialBlog?.status ?? 'published');
  const [coverImage, setCoverImage] = useState(
    initialBlog?.coverImage ?? HOSPITAL_IMAGES.heroCampus,
  );
  const [excerpt, setExcerpt] = useState(initialBlog?.excerpt ?? '');
  const [content, setContent] = useState(initialBlog?.content ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      setSlug(slugifyTitle(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanTitle = sanitizeText(title, SCHEMA_LIMITS.BLOG_TITLE_MAX);
    const cleanSlug = sanitizeText(slug || slugifyTitle(cleanTitle), SCHEMA_LIMITS.BLOG_SLUG_MAX)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const cleanAuthor = sanitizeText(authorName, SCHEMA_LIMITS.DISPLAY_NAME_MAX);
    const cleanCover = sanitizeText(coverImage, SCHEMA_LIMITS.BLOG_COVER_MAX);
    const cleanExcerpt = sanitizeText(excerpt, SCHEMA_LIMITS.BLOG_EXCERPT_MAX);
    const cleanContent = sanitizeText(content, SCHEMA_LIMITS.BLOG_CONTENT_MAX);
    const cleanReadTime = Math.min(60, Math.max(1, Math.round(Number(readTimeMinutes) || 3)));

    if (cleanTitle.length < 4) {
      setValidationError('Title must be at least 4 characters.');
      return;
    }
    if (!SCHEMA_LIMITS.SLUG_PATTERN.test(cleanSlug) || cleanSlug.length < 3) {
      setValidationError('Slug must use lowercase letters, numbers, and hyphens only.');
      return;
    }
    if (!SCHEMA_LIMITS.SAFE_COVER_URL_PATTERN.test(cleanCover)) {
      setValidationError(
        'Cover image must be a selected campus preset or a valid https:// image URL.',
      );
      return;
    }
    if (!SCHEMA_LIMITS.DATE_PATTERN.test(publishedAt)) {
      setValidationError('Publish date must be in YYYY-MM-DD format.');
      return;
    }
    if (cleanExcerpt.length < 10) {
      setValidationError('Summary excerpt must be at least 10 characters.');
      return;
    }
    if (cleanContent.length < 20) {
      setValidationError('Article body must be at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (initialBlog) {
        await updateDoc(doc(db, 'blogs', initialBlog.id), {
          title: cleanTitle,
          slug: cleanSlug,
          category,
          excerpt: cleanExcerpt,
          content: cleanContent,
          coverImage: cleanCover,
          authorName: cleanAuthor,
          readTimeMinutes: cleanReadTime,
          status,
          publishedAt,
          updatedAt: serverTimestamp(),
        });
        onSaved(`Updated blog post "${cleanTitle}".`);
      } else {
        await addDoc(collection(db, 'blogs'), {
          title: cleanTitle,
          slug: cleanSlug,
          category,
          excerpt: cleanExcerpt,
          content: cleanContent,
          coverImage: cleanCover,
          authorName: cleanAuthor,
          authorUid,
          readTimeMinutes: cleanReadTime,
          status,
          publishedAt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        onSaved(
          status === 'published'
            ? `Created and published "${cleanTitle}".`
            : `Saved draft "${cleanTitle}".`,
        );
      }
    } catch (err) {
      try {
        handleFirestoreError(
          err,
          initialBlog ? OperationType.UPDATE : OperationType.CREATE,
          initialBlog ? `blogs/${initialBlog.id}` : 'blogs',
        );
      } catch {
        onError('Unable to save blog post. Please verify all fields and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initialBlog ? 'Edit Blog Post' : 'Create Blog Post'}
      className="fixed inset-0 z-50 bg-[#0D1814]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-white rounded-2xl border border-[#DCE3DD] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E2E7E2] flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#14221D]">
              {initialBlog ? 'Edit Blog Post' : 'Create & Publish Blog Post'}
            </h2>
            <p className="text-xs text-[#4A5D55]">
              Published posts appear immediately on the public Nisarga Care Blogs page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="p-2 rounded-lg text-[#4A5D55] hover:bg-[#F1F4F1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <div
              role="alert"
              className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg"
            >
              {validationError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="blog-title" className="block text-xs font-medium text-[#4A5D55] mb-1">
                Article Title
              </label>
              <input
                id="blog-title"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.BLOG_TITLE_MAX}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., How Morning Physiotherapy Accelerates Post-Stroke Recovery"
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div>
              <label htmlFor="blog-slug" className="block text-xs font-medium text-[#4A5D55] mb-1">
                URL Slug
              </label>
              <input
                id="blog-slug"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.BLOG_SLUG_MAX}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="post-stroke-recovery-guide"
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div>
              <label
                htmlFor="blog-category"
                className="block text-xs font-medium text-[#4A5D55] mb-1"
              >
                Care Category
              </label>
              <select
                id="blog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BlogCategory)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="blog-author" className="block text-xs font-medium text-[#4A5D55] mb-1">
                Author Name
              </label>
              <input
                id="blog-author"
                type="text"
                required
                maxLength={SCHEMA_LIMITS.DISPLAY_NAME_MAX}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="blog-date" className="block text-xs font-medium text-[#4A5D55] mb-1">
                  Date
                </label>
                <input
                  id="blog-date"
                  type="date"
                  required
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                />
              </div>
              <div>
                <label htmlFor="blog-read" className="block text-xs font-medium text-[#4A5D55] mb-1">
                  Read (m)
                </label>
                <input
                  id="blog-read"
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={readTimeMinutes}
                  onChange={(e) => setReadTimeMinutes(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                />
              </div>
              <div>
                <label
                  htmlFor="blog-status"
                  className="block text-xs font-medium text-[#4A5D55] mb-1"
                >
                  Visibility
                </label>
                <select
                  id="blog-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BlogStatus)}
                  className="w-full px-2 py-2 text-xs bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cover Image Picker + Custom URL */}
          <div className="p-4 bg-[#FAF9F6] border border-[#E2E7E2] rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-4 aspect-[16/10] rounded-lg overflow-hidden bg-[#EAF1EC] border border-[#DCE3DD]">
              <HospitalImage
                src={coverImage}
                alt="Cover preview"
                fallbackTitle="Cover Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-8 space-y-2.5">
              <div>
                <label
                  htmlFor="blog-cover-preset"
                  className="block text-xs font-medium text-[#4A5D55] mb-1"
                >
                  Choose Nisarga Campus Cover Image
                </label>
                <select
                  id="blog-cover-preset"
                  value={
                    BLOG_COVER_PRESETS.some((p) => p.url === coverImage) ? coverImage : '__custom__'
                  }
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      setCoverImage(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                >
                  {BLOG_COVER_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="__custom__">Custom HTTPS Image URL</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="blog-cover-url"
                  className="block text-xs font-medium text-[#4A5D55] mb-1"
                >
                  Or Direct Image URL (https://...)
                </label>
                <input
                  id="blog-cover-url"
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.BLOG_COVER_MAX}
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="blog-excerpt" className="block text-xs font-medium text-[#4A5D55] mb-1">
              Short Summary Excerpt ({excerpt.length}/{SCHEMA_LIMITS.BLOG_EXCERPT_MAX})
            </label>
            <textarea
              id="blog-excerpt"
              rows={2}
              required
              maxLength={SCHEMA_LIMITS.BLOG_EXCERPT_MAX}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Concise 1–2 sentence preview displayed on blog cards..."
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43]"
            />
          </div>

          <div>
            <label htmlFor="blog-content" className="block text-xs font-medium text-[#4A5D55] mb-1">
              Full Article Body (separate paragraphs with a blank line)
            </label>
            <textarea
              id="blog-content"
              rows={8}
              required
              maxLength={SCHEMA_LIMITS.BLOG_CONTENT_MAX}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write helpful, compassionate clinical insights for families..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D4DDD6] rounded-lg focus:outline-none focus:border-[#135D43] leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-[#E2E7E2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4A5D55] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : initialBlog
                  ? 'Save Changes'
                  : status === 'published'
                    ? 'Create & Publish'
                    : 'Save Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
