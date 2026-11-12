export type BlogImport = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  content_type: 'article' | 'guide' | 'story' | 'news';
  editor_name: string;
  primary_keyword: string;
  secondary_keywords: string;
  cta_label: string;
  cta_url: string;
};

export const MAX_BLOG_IMPORT_BYTES = 1024 * 1024;

function stringField(source: Record<string, unknown>, key: string, required = false): string {
  const value = source[key];
  if (value === undefined && !required) return '';
  if (typeof value !== 'string') throw new Error(`${key} must be a string.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`${key} is required.`);
  return trimmed;
}

export function parseBlogImport(value: unknown): BlogImport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The JSON must contain one blog object.');
  const source = value as Record<string, unknown>;
  if (source.schema_version !== '1.0') throw new Error('schema_version must be "1.0".');

  const title = stringField(source, 'title', true);
  const slug = stringField(source, 'slug', true);
  const content = stringField(source, 'content', true);
  const excerpt = stringField(source, 'excerpt', true);
  const primary_keyword = stringField(source, 'primary_seo_keyword', true);
  if (title.length > 255) throw new Error('title must be 255 characters or less.');
  if (slug.length > 255 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('slug must use lowercase letters, numbers and single hyphens.');
  const type = stringField(source, 'type').toLowerCase();
  if (type && !['article', 'guide', 'story', 'news'].includes(type)) throw new Error('type must be article, guide, story or news.');
  const keywords = source.secondary_seo_keywords;
  if (keywords !== undefined && (!Array.isArray(keywords) || keywords.some(keyword => typeof keyword !== 'string'))) {
    throw new Error('secondary_seo_keywords must be an array of strings.');
  }
  const cta_label = stringField(source, 'button_text') || 'Book now →';
  const cta_url = stringField(source, 'button_link') || '/book-session';
  if (cta_label.length > 60) throw new Error('button_text must be 60 characters or less.');
  let externalHttps = false;
  try {
    const url = new URL(cta_url);
    externalHttps = url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password && !/[\s\\]/.test(cta_url);
  } catch { /* A local path is checked below. */ }
  if (cta_url.length > 500 || !(/^\/(?!\/)[^\s\\]*$/.test(cta_url) || externalHttps)) {
    throw new Error('button_link must be a site path or HTTPS URL.');
  }

  return {
    title, slug, content, excerpt,
    content_type: (type || 'article') as BlogImport['content_type'],
    editor_name: stringField(source, 'editor_name') || 'Mannosaar Editorial',
    primary_keyword,
    secondary_keywords: (keywords as string[] | undefined)?.map(keyword => keyword.trim()).filter(Boolean).join(', ') || '',
    cta_label, cta_url,
  };
}
