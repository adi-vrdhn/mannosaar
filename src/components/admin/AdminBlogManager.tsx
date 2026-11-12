'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSectionNav from './AdminSectionNav';
import { clipboardHtml, insertClipboardHtml } from '@/lib/blog-paste';
import { istDateTimeInputToIso, toIstDateTimeInput } from '@/lib/blog-time';

type Status = 'draft' | 'published' | 'scheduled';
type Filter = Status | 'all';
type Blog = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  content_type: string;
  editor_name: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  cta_label?: string | null;
  cta_url?: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  views_count: number | null;
};
type Form = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  content_type: string;
  editor_name: string;
  primary_keyword: string;
  secondary_keywords: string;
  cta_label: string;
  cta_url: string;
  status: Status;
  published_at: string;
};

const empty: Form = {
  title: '', slug: '', content: '', excerpt: '', featured_image: '', content_type: 'article',
  editor_name: '', primary_keyword: '', secondary_keywords: '', cta_label: 'Book now', cta_url: '/book-session', status: 'draft', published_at: '',
};
const field = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100';
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const formatDate = (value: string | null | undefined) => value ? `${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value))} IST` : 'Not set';
const statusOf = (blog: Blog): Status => !blog.is_published ? 'draft' : blog.published_at && new Date(blog.published_at).getTime() > Date.now() ? 'scheduled' : 'published';
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All posts' }, { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' }, { value: 'draft', label: 'Drafts' },
];
function contentFacts(blog: Blog) {
  const content = blog.content || '';
  return {
    words: content.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').trim().split(/\s+/).filter(Boolean).length,
    headings: (content.match(/<h[2-3]\b/gi) || []).length,
    links: (content.match(/<a\s[^>]*href=/gi) || []).length,
    internalLinks: (content.match(/href=["'](?:\/|https:\/\/(?:www\.)?mannosaar\.com\/)/gi) || []).length,
  };
}
function statusStyle(status: Status) {
  if (status === 'published') return 'bg-green-50 text-green-800 border-green-200';
  if (status === 'scheduled') return 'bg-blue-50 text-blue-800 border-blue-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export default function AdminBlogManager({ mode = 'list', editId }: { mode?: 'list' | 'editor'; editId?: string }) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(empty);
  const [editingId, setEditingId] = useState<string | null>(editId || null);
  const [editorLoading, setEditorLoading] = useState(Boolean(editId));
  const [editorReady, setEditorReady] = useState(!editId);
  const [busy, setBusy] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (requestedPage: number, requestedFilter: Filter) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blogs?page=${requestedPage}&status=${requestedFilter}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load blogs');
      setBlogs(data.blogs || []);
      setTotal(data.total || 0);
      if (requestedPage > 1 && !data.blogs?.length) setPage(requestedPage - 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load blogs');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (mode === 'list') void load(page, filter); }, [page, filter, load, mode]);

  const set = (key: keyof Form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  useEffect(() => {
    if (mode !== 'editor' || !editId) return;
    let cancelled = false;
    const loadEdit = async () => {
      try {
        const response = await fetch(`/api/admin/blogs/${encodeURIComponent(editId)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load blog');
        if (cancelled) return;
        const blog = data.blog as Blog;
        setEditingId(blog.id);
        setForm({
          title: blog.title, slug: blog.slug, content: blog.content, excerpt: blog.excerpt || '',
          featured_image: blog.featured_image || '', content_type: blog.content_type || 'article',
          editor_name: blog.editor_name || '', primary_keyword: blog.primary_keyword || '',
          secondary_keywords: (blog.secondary_keywords || []).join(', '), status: statusOf(blog),
          cta_label: blog.cta_label || 'Book now', cta_url: blog.cta_url || '/book-session',
          published_at: blog.published_at ? toIstDateTimeInput(blog.published_at) : '',
        });
        if (editorRef.current) editorRef.current.innerHTML = blog.content;
        setEditorReady(true);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load blog');
      } finally {
        if (!cancelled) setEditorLoading(false);
      }
    };
    void loadEdit();
    return () => { cancelled = true; };
  }, [editId, mode]);
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current;
    if (!editor) return;
    const richHtml = event.clipboardData.getData('text/html');
    const plainText = event.clipboardData.getData('text/plain');
    if (!richHtml && !plainText) return;
    event.preventDefault();
    insertClipboardHtml(editor, clipboardHtml(richHtml, plainText, document), document);
  };
  const uploadCover = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPG, PNG, WebP or AVIF under 10 MB'); return;
    }
    setBusy(true);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new window.Image();
        const url = URL.createObjectURL(file);
        image.onload = () => { resolve({ width: image.width, height: image.height }); URL.revokeObjectURL(url); };
        image.onerror = () => { reject(new Error('Could not read image')); URL.revokeObjectURL(url); };
        image.src = url;
      });
      if (dimensions.width !== dimensions.height) throw new Error('Cover image must be square (1:1)');
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'mental-health/blog-covers');
      data.append('resourceType', 'image');
      const response = await fetch('/api/upload-image', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      set('featured_image', result.imageUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };
  const payloadFor = (blog: Blog, status: Status) => ({
    title: blog.title, slug: blog.slug, content: blog.content, excerpt: blog.excerpt,
    featured_image: blog.featured_image, content_type: blog.content_type,
    editor_name: blog.editor_name, primary_keyword: blog.primary_keyword,
    secondary_keywords: blog.secondary_keywords || [], status,
    cta_label: blog.cta_label || 'Book now', cta_url: blog.cta_url || '/book-session',
    published_at: status === 'scheduled' ? blog.published_at : null,
  });
  const changeStatus = async (blog: Blog, status: 'draft' | 'published') => {
    setActionId(blog.id); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(blog, status)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update blog');
      setMessage(status === 'published' ? 'Blog published' : 'Blog moved to drafts');
      await load(page, filter);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update blog');
    } finally {
      setActionId(null);
    }
  };
  const deleteBlog = async (blog: Pick<Blog, 'id' | 'title'>) => {
    setActionId(blog.id); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/blogs/${encodeURIComponent(blog.id)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete blog');
      setDeleteTargetId(null);
      if (mode === 'editor') router.push('/admin/blogs');
      else {
        setMessage(`“${blog.title}” was deleted.`);
        await load(page, filter);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete blog');
    } finally {
      setActionId(null);
    }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editorReady) return;
    setError(''); setMessage(''); setBusy(true);
    try {
      const publishingTime = form.published_at ? istDateTimeInputToIso(form.published_at) : null;
      if (form.status === 'scheduled' && (!publishingTime || Date.parse(publishingTime) <= Date.now())) throw new Error('Choose a future publishing time in IST');
      const content = editorRef.current?.innerHTML || form.content;
      const payload = {
        ...form, content,
        secondary_keywords: form.secondary_keywords.split(',').map(word => word.trim()).filter(Boolean),
        published_at: publishingTime,
      };
      const response = await fetch(editingId ? `/api/admin/blogs/${editingId}` : '/api/blogs', {
        method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save blog');
      router.push('/admin/blogs');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save blog');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-purple-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <AdminSectionNav className="mb-8" />
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Content management</p><h1 className="mt-1 text-3xl font-bold text-purple-950">{mode === 'editor' ? editingId ? 'Edit blog' : 'Create a new blog' : 'Blogs'}</h1><p className="mt-1 text-slate-600">{mode === 'editor' ? 'Write and prepare your article for publishing.' : 'Review and manage your articles.'}</p></div>
          {mode === 'editor' ? <div className="flex flex-wrap gap-2"><Link href="/admin/blogs" className="rounded-lg border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-800 hover:bg-purple-50">← Back to blogs</Link>{editingId && <button type="button" disabled={!editorReady || actionId === editingId} onClick={() => setDeleteTargetId(editingId)} className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete blog</button>}</div> : <Link href="/admin/blogs/new" className="rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800">+ Create new blog</Link>}
        </header>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">{message}</p>}
        {mode === 'editor' && editingId && deleteTargetId === editingId && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4" role="group" aria-label={`Confirm deleting ${form.title}`}>
          <p className="text-sm font-semibold text-red-900">Delete “{form.title}” permanently?</p>
          <p className="mt-1 text-sm text-red-800">This removes the blog from the site and cannot be undone.</p>
          <div className="mt-3 flex gap-3"><button type="button" disabled={actionId === editingId} onClick={() => void deleteBlog({ id: editingId, title: form.title })} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{actionId === editingId ? 'Deleting…' : 'Yes, delete'}</button><button type="button" disabled={actionId === editingId} onClick={() => setDeleteTargetId(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button></div>
        </div>}

        {mode === 'editor' && <section aria-labelledby="editor-heading" className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Write</p><h2 id="editor-heading" className="mt-1 text-2xl font-bold text-purple-950">{editingId ? 'Edit blog' : 'Create a new blog'}</h2><p className="mt-1 text-sm text-slate-600">Add the article, cover and search details, then choose when to publish.</p></div>
            {editingId && <Link href="/admin/blogs" className="shrink-0 text-sm font-semibold text-purple-700 underline">Cancel edit</Link>}
          </div>
          {editorLoading && <p role="status" className="mb-5 text-sm text-slate-600">Loading blog…</p>}
          <form onSubmit={save} aria-busy={editorLoading} className={`space-y-6 ${!editorReady ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold">Title<input required maxLength={255} className={field} value={form.title} onChange={event => { const title = event.target.value; setForm(previous => ({ ...previous, title, slug: previous.slug === slugify(previous.title) ? slugify(title) : previous.slug })); }} /></label>
              <label className="block text-sm font-semibold">Slug<input required className={field} value={form.slug} onChange={event => set('slug', slugify(event.target.value))} /></label>
              <label className="block text-sm font-semibold">Type<select className={field} value={form.content_type} onChange={event => set('content_type', event.target.value)}><option value="article">Article</option><option value="guide">Guide</option><option value="story">Story</option><option value="news">News</option></select></label>
              <label className="block text-sm font-semibold">Editor name<input className={field} value={form.editor_name} onChange={event => set('editor_name', event.target.value)} /></label>
            </div>
            <div>
              <p className="text-sm font-semibold">Square cover image</p>
              <input id="blog-cover-upload" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => { void uploadCover(event.target.files?.[0]); event.target.value = ''; }} />
              <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void uploadCover(event.dataTransfer.files?.[0]); }} className="mt-2 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5">
                {form.featured_image ? <div className="flex flex-wrap items-center gap-5">
                  <Image unoptimized src={form.featured_image} alt="Uploaded blog cover preview" width={176} height={176} className="aspect-square h-44 w-44 rounded-lg border border-purple-100 object-cover" />
                  <div><p className="font-semibold text-slate-900">Cover uploaded</p><p className="mt-1 text-sm text-slate-600">This image will appear above the article.</p><div className="mt-4 flex gap-4"><label htmlFor="blog-cover-upload" className="cursor-pointer text-sm font-semibold text-purple-700 underline">Change image</label><button type="button" className="text-sm font-semibold text-red-700 underline" onClick={() => set('featured_image', '')}>Remove</button></div></div>
                </div> : <label htmlFor="blog-cover-upload" className="block cursor-pointer py-5 text-center"><span className="block font-semibold text-purple-900">{busy ? 'Uploading image…' : 'Click to upload or drop an image here'}</span><span className="mt-1 block text-sm text-slate-600">Square JPG, PNG, WebP or AVIF · up to 10 MB</span></label>}
              </div>
            </div>
            <div><label className="block text-sm font-semibold">Content</label><p className="mt-1 text-xs text-slate-500">Paste from ChatGPT here. Headings, lists, bold text and hyperlinks are kept.</p><div ref={editorRef} contentEditable suppressContentEditableWarning onPaste={handlePaste} role="textbox" aria-label="Blog content" aria-multiline="true" className="blog-rich-text mt-2 min-h-96 rounded-lg border border-slate-300 p-4 text-gray-800 leading-relaxed focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100" /></div>
            <label className="block text-sm font-semibold">Excerpt / SEO description<textarea className={field} rows={3} value={form.excerpt} onChange={event => set('excerpt', event.target.value)} /></label>
            <div className="grid gap-5 md:grid-cols-2"><label className="block text-sm font-semibold">Primary SEO keyword<input className={field} value={form.primary_keyword} onChange={event => set('primary_keyword', event.target.value)} /></label><label className="block text-sm font-semibold">Secondary SEO keywords (comma separated)<input className={field} value={form.secondary_keywords} onChange={event => set('secondary_keywords', event.target.value)} /></label></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Search preview</p>
              <p className="mt-4 truncate text-xs text-emerald-800">mannosaar.com › blogs › {form.slug || 'your-article'}</p>
              <p className="mt-1 text-lg font-medium text-blue-800">{form.title || 'Your blog title'}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{form.excerpt || 'Your SEO description will appear here.'}</p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="SEO keyword preview">
                {form.primary_keyword.trim() && <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-900">Primary: {form.primary_keyword.trim()}</span>}
                {form.secondary_keywords.split(',').map(keyword => keyword.trim()).filter(Boolean).map((keyword, index) => <span key={`${keyword}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">{keyword}</span>)}
                {!form.primary_keyword.trim() && !form.secondary_keywords.trim() && <span className="text-xs text-slate-500">Add keywords to preview them here.</span>}
              </div>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-5">
              <h3 className="font-semibold text-purple-950">Article button</h3>
              <p className="mt-1 text-sm text-slate-600">Shown directly below the title and cover image.</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-semibold">Button text<input className={field} maxLength={60} value={form.cta_label} onChange={event => set('cta_label', event.target.value)} placeholder="Book now" /></label>
                <label className="block text-sm font-semibold">Button link<input className={field} maxLength={500} value={form.cta_url} onChange={event => set('cta_url', event.target.value)} placeholder="/book-session" /></label>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4"><span className="inline-flex rounded-full bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white">{form.cta_label.trim() || 'Book now'} →</span><span className="break-all text-xs text-slate-600">Links to {form.cta_url.trim() || '/book-session'}</span></div>
            </div>
            <div className="grid gap-5 md:grid-cols-2"><label className="block text-sm font-semibold">Publishing<select className={field} value={form.status} onChange={event => set('status', event.target.value)}><option value="draft">Save draft</option><option value="published">Publish now</option><option value="scheduled">Publish later</option></select></label>{form.status === 'scheduled' && <label className="block text-sm font-semibold">Publish at (IST, GMT+5:30)<input required type="datetime-local" className={field} value={form.published_at} onChange={event => set('published_at', event.target.value)} /><span className="mt-1 block text-xs font-normal text-slate-500">Enter the date and time in India Standard Time.</span></label>}</div>
            <button disabled={busy || !editorReady} className="rounded-lg bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800 disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Update blog' : 'Save blog'}</button>
          </form>
        </section>}

        {mode === 'list' && <section aria-labelledby="existing-heading" className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Review</p><h2 id="existing-heading" className="mt-1 text-2xl font-bold text-purple-950">Existing blogs and drafts</h2><p className="mt-1 text-sm text-slate-600">Status, dates, content checks and publishing actions.</p></div><p className="text-sm text-slate-500">{total} {total === 1 ? 'post' : 'posts'}</p></div>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter blogs by status">{filters.map(item => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setPage(1); }} className={`rounded-full border px-4 py-2 text-sm font-medium ${filter === item.value ? 'border-purple-600 bg-purple-100 text-purple-900' : 'border-slate-200 text-slate-600 hover:border-purple-300'}`}>{item.label}</button>)}</div>
          {loading ? <p className="py-10 text-center text-slate-500">Loading blogs…</p> : blogs.length === 0 ? <p className="py-10 text-center text-slate-500">No posts in this status yet.</p> : <div className="mt-5 space-y-4">{blogs.map(blog => {
            const status = statusOf(blog);
            const facts = contentFacts(blog);
            return <article key={blog.id} className="rounded-xl border border-slate-200 p-4 md:p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                {blog.featured_image ? <Image unoptimized src={blog.featured_image} alt="" width={104} height={104} className="h-24 w-24 shrink-0 rounded-lg object-cover" /> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-center text-xs text-purple-700">No cover</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusStyle(status)}`}>{status}</span><span className="text-xs text-slate-500">{blog.content_type || 'article'}</span></div><button type="button" disabled={actionId === blog.id} onClick={() => setDeleteTargetId(blog.id)} className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${blog.title}`}>Delete blog</button></div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{blog.title}</h3>
                  <p className="mt-1 break-all text-xs text-slate-500">/blogs/{blog.slug}</p>
                  <p className="mt-2 text-xs text-slate-600">Created {formatDate(blog.created_at)} · Updated {formatDate(blog.updated_at || blog.created_at)}</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">{status === 'scheduled' ? `Scheduled for ${formatDate(blog.published_at)}` : status === 'published' ? `Published ${formatDate(blog.published_at || blog.created_at)}` : 'Not published'}</p>
                  <p className="mt-2 text-sm font-semibold text-purple-800">{(blog.views_count || 0).toLocaleString('en-IN')} views</p>
                </div>
              </div>
              <details className="mt-4 rounded-lg bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-purple-800">Basic audit details</summary><p className="mt-2 text-xs text-slate-500">Field and content checks only; these do not measure search ranking or clinical accuracy.</p><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-slate-500">Cover</dt><dd className="font-medium">{blog.featured_image ? 'Added' : 'Missing'}</dd></div>
                <div><dt className="text-slate-500">SEO description</dt><dd className="font-medium">{blog.excerpt ? `${blog.excerpt.length} characters` : 'Missing'}</dd></div>
                <div><dt className="text-slate-500">Primary keyword</dt><dd className="font-medium">{blog.primary_keyword || 'Missing'}</dd></div>
                <div><dt className="text-slate-500">Secondary keywords</dt><dd className="font-medium">{blog.secondary_keywords?.length || 0}</dd></div>
                <div><dt className="text-slate-500">Article length</dt><dd className="font-medium">{facts.words} words</dd></div>
                <div><dt className="text-slate-500">H2/H3 headings</dt><dd className="font-medium">{facts.headings}</dd></div>
                <div><dt className="text-slate-500">Links</dt><dd className="font-medium">{facts.links} total · {facts.internalLinks} internal</dd></div>
                <div><dt className="text-slate-500">Editor</dt><dd className="font-medium">{blog.editor_name || 'Not set'}</dd></div>
              </dl></details>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link href={`/admin/blogs/${encodeURIComponent(blog.id)}/edit`} className="rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-50">Edit</Link>
                {status === 'published' && <Link href={`/blogs/${encodeURIComponent(blog.slug)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View live</Link>}
                {status !== 'published' && <button type="button" disabled={actionId === blog.id} onClick={() => void changeStatus(blog, 'published')} className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50">Publish now</button>}
                {status !== 'draft' && <button type="button" disabled={actionId === blog.id} onClick={() => void changeStatus(blog, 'draft')} className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">Move to draft</button>}
              </div>
              {deleteTargetId === blog.id && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4" role="group" aria-label={`Confirm deleting ${blog.title}`}>
                <p className="text-sm font-semibold text-red-900">Delete “{blog.title}” permanently?</p>
                <p className="mt-1 text-sm text-red-800">This removes the {status} post from the site and cannot be undone.</p>
                <div className="mt-3 flex gap-3"><button type="button" disabled={actionId === blog.id} onClick={() => void deleteBlog(blog)} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{actionId === blog.id ? 'Deleting…' : 'Yes, delete'}</button><button type="button" disabled={actionId === blog.id} onClick={() => setDeleteTargetId(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button></div>
              </div>}
            </article>;
          })}</div>}
          {total > 20 && <nav aria-label="Blog list pages" className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-sm"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-semibold text-purple-700 disabled:text-slate-400">← Previous</button><span className="text-slate-500">Page {page} of {Math.ceil(total / 20)}</span><button type="button" disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="font-semibold text-purple-700 disabled:text-slate-400">Next →</button></nav>}
        </section>}
      </div>
    </main>
  );
}
