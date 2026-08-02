import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { NewsShell } from '@/components/news/NewsShell';
import { useAuth } from '@/hooks/useAuth';
import {
  createArticle,
  updateArticle,
  fetchArticleById,
  uploadArticleImage,
} from '@/data/articleStorage';
import { CATEGORIES } from '@/data/articleTypes';
import type { Category } from '@/data/articleTypes';
import { isSafeArticleLinkUrl, validateArticleImageFile } from '@/utils/articleSecurity';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function EditorToolbar({
  editor,
  onImageUpload,
  onError,
}: {
  editor: ReturnType<typeof useEditor>;
  onImageUpload: (file: File) => Promise<void>;
  onError: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `editor-toolbar__btn${active ? ' editor-toolbar__btn--active' : ''}`;

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type="button"
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={btn(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        className={btn(editor.isActive('heading', { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3" cy="6" r="1.5" fill="currentColor" />
          <circle cx="3" cy="12" r="1.5" fill="currentColor" />
          <circle cx="3" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">
            1
          </text>
          <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">
            2
          </text>
          <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">
            3
          </text>
        </svg>
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        className={btn(editor.isActive('blockquote'))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 7H6a2 2 0 00-2 2v3a2 2 0 002 2h2l-2 4h2.5l2-4V9a2 2 0 00-2-2zm10 0h-4a2 2 0 00-2 2v3a2 2 0 002 2h2l-2 4h2.5l2-4V9a2 2 0 00-2-2z" />
        </svg>
      </button>
      <button
        type="button"
        className={btn(editor.isActive('codeBlock'))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        className={btn(editor.isActive('link'))}
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt('URL:');
            if (url) {
              const trimmedUrl = url.trim();
              if (isSafeArticleLinkUrl(trimmedUrl)) {
                editor.chain().focus().setLink({ href: trimmedUrl }).run();
              } else {
                onError('Only http(s), mailto, tel, and relative links are allowed.');
              }
            }
          }
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <button
        type="button"
        className="editor-toolbar__btn"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      </button>
      <div className="editor-toolbar__sep" />
      <button
        type="button"
        className="editor-toolbar__btn"
        disabled={uploading}
        title="Insert image"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ opacity: 0.5 }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" className="editor-toolbar__spin" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const validationError = validateArticleImageFile(file);
          if (validationError) {
            onError(validationError);
            e.target.value = '';
            return;
          }
          setUploading(true);
          try {
            await onImageUpload(file);
          } finally {
            setUploading(false);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<Category>('Tech');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
    ],
    content: '',
  });

  const handleImageUpload = useCallback(
    async (file: File) => {
      const url = await uploadArticleImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    },
    [editor],
  );

  useEffect(() => {
    if (!id || !editor) return;
    let cancelled = false;
    setLoadingExisting(true);

    fetchArticleById(id).then((article) => {
      if (cancelled || !article) {
        if (!cancelled) {
          setError('Article not found');
          setLoadingExisting(false);
        }
        return;
      }
      setTitle(article.title);
      setSlug(article.slug);
      setSlugManual(true);
      setExcerpt(article.excerpt);
      setCategory(article.category);
      setCoverImageUrl(article.coverImageUrl ?? null);
      setIsFeatured(article.isFeatured);
      setIsTrending(article.isTrending);
      if (!editor.isDestroyed) {
        editor.commands.setContent(article.content);
      }
      setLoadingExisting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, editor]);

  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const handleSave = useCallback(
    async (publish: boolean) => {
      if (!editor || !session?.user) return;
      setError(null);

      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      if (!slug.trim()) {
        setError('Slug is required');
        return;
      }
      if (!excerpt.trim()) {
        setError('Excerpt is required');
        return;
      }

      const html = editor.getHTML();
      if (html === '<p></p>' || !html.trim()) {
        setError('Content is required');
        return;
      }

      setSaving(true);
      try {
        const input = {
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content: html,
          category,
          coverImageUrl,
          readingTimeMinutes: estimateReadingTime(html),
          isFeatured,
          isTrending,
          published: publish,
        };

        if (isEditing && id) {
          await updateArticle(id, input);
        } else {
          await createArticle(input, session.user.id);
        }

        navigate('/news', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save article');
      } finally {
        setSaving(false);
      }
    },
    [
      editor,
      session,
      title,
      slug,
      excerpt,
      category,
      coverImageUrl,
      isFeatured,
      isTrending,
      isEditing,
      id,
      navigate,
    ],
  );

  if (loadingExisting) {
    return (
      <NewsShell>
        <div className="article-editor">
          <p className="article-editor__loading">Loading article...</p>
        </div>
      </NewsShell>
    );
  }

  return (
    <NewsShell>
      <div className="article-editor">
        <header className="article-editor__header">
          <h1 className="article-editor__page-title">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
        </header>

        {error && <div className="article-editor__error">{error}</div>}

        <div className="article-editor__fields">
          <div className="article-editor__field">
            <label className="article-editor__label">Title</label>
            <input
              type="text"
              className="article-editor__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              maxLength={200}
            />
          </div>

          <div className="article-editor__field">
            <label className="article-editor__label">Slug</label>
            <input
              type="text"
              className="article-editor__input"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManual(true);
              }}
              placeholder="url-friendly-slug"
              maxLength={100}
            />
          </div>

          <div className="article-editor__field">
            <label className="article-editor__label">Excerpt</label>
            <textarea
              className="article-editor__textarea"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary shown in article cards"
              rows={2}
              maxLength={300}
            />
          </div>

          <div className="article-editor__field">
            <label className="article-editor__label">Cover Image</label>
            {coverImageUrl ? (
              <div className="article-editor__cover-preview">
                <img src={coverImageUrl} alt="Cover preview" />
                <button
                  type="button"
                  className="news-btn news-btn--small news-btn--danger"
                  onClick={() => setCoverImageUrl(null)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="article-editor__cover-upload-btn"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const validationError = validateArticleImageFile(file);
                if (validationError) {
                  setError(validationError);
                  e.target.value = '';
                  return;
                }
                setUploadingCover(true);
                try {
                  const url = await uploadArticleImage(file);
                  setCoverImageUrl(url);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to upload cover image');
                } finally {
                  setUploadingCover(false);
                  e.target.value = '';
                }
              }}
            />
          </div>

          <div className="article-editor__row">
            <div className="article-editor__field">
              <label className="article-editor__label">Category</label>
              <select
                className="article-editor__select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <label className="article-editor__checkbox">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Featured
            </label>

            <label className="article-editor__checkbox">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
              />
              Trending
            </label>
          </div>
        </div>

        <div className="article-editor__editor">
          <label className="article-editor__label">Content</label>
          <EditorToolbar
            editor={editor}
            onImageUpload={handleImageUpload}
            onError={(message) => setError(message)}
          />
          <div className="article-editor__content">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="article-editor__actions">
          <button className="news-btn" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="news-btn news-btn--primary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish'}
          </button>
          <button
            className="news-btn news-btn--ghost"
            onClick={() => navigate('/news')}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </NewsShell>
  );
}
