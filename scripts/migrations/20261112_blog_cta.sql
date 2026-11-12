-- CTA shown below the cover image on published blog posts.
alter table public.blogs
  add column if not exists cta_label text not null default 'Book now',
  add column if not exists cta_url text not null default '/book-session';

update public.blogs
set cta_label = 'Book now'
where cta_label is null or btrim(cta_label) = '';

update public.blogs
set cta_url = '/book-session'
where cta_url is null or btrim(cta_url) = '';

notify pgrst, 'reload schema';
