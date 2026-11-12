# Mannosaar ChatGPT Blog Import Format v1.0

On **Admin → Blogs → Create new blog**, select **Import from ChatGPT** and choose a `.json` file. The import fills the form locally. Review the article, upload a square cover image, and save or publish manually. Importing does not save the article.

The file must contain one JSON object, use `"schema_version": "1.0"`, and be no larger than 1 MB.

| Field | Required | Description |
| --- | --- | --- |
| `schema_version` | Yes | Exactly `"1.0"` |
| `title` | Yes | Nonempty text, at most 255 characters |
| `slug` | Yes | Lowercase letters and numbers separated by single hyphens, at most 255 characters |
| `content` | Yes | Nonempty HTML; must contain readable text after sanitization |
| `excerpt` | Yes | Nonempty SEO description |
| `primary_seo_keyword` | Yes | Nonempty text |
| `type` | No | `article`, `guide`, `story`, or `news`; defaults to `article` |
| `editor_name` | No | Defaults to `Mannosaar Editorial` when blank |
| `secondary_seo_keywords` | No | Array of strings; displayed as comma-separated keywords |
| `button_text` | No | Defaults to `Book now →`; at most 60 characters |
| `button_link` | No | Defaults to `/book-session`; a site path or HTTPS URL, at most 500 characters |

Wrong field types, unsupported article types, invalid slugs, and invalid button links reject the whole file. HTML is sanitized before it enters the editor. Headings, paragraphs, emphasis, lists, blockquotes, and safe links are retained; scripts, embedded content, event handlers, and unsafe links are removed.

The editor has no separate category field. Its article type controls the public blog category; `article` appears under Mental Health. An existing cover image and the current publishing choice are preserved. The importer asks before replacing unsaved blog fields.

```json
{
  "schema_version": "1.0",
  "title": "Why Do I Feel Sad for No Reason?",
  "slug": "feeling-sad-for-no-reason",
  "type": "article",
  "editor_name": "Mannosaar Editorial",
  "content": "<h2>Introduction</h2><p>Feeling sad without a clear cause can be unsettling. <strong>Your feelings matter.</strong></p><h3>What can help?</h3><ul><li>Pause and name the feeling.</li><li>Talk with someone you trust.</li></ul><p>Read more about <a href=\"/services\">our services</a>.</p>",
  "excerpt": "Learn why sadness can appear without an obvious cause and ways to support your emotional wellbeing.",
  "primary_seo_keyword": "feeling sad for no reason",
  "secondary_seo_keywords": ["unexplained sadness", "why am I sad", "feeling low", "emotional wellbeing"],
  "button_text": "Book now →",
  "button_link": "/book-session"
}
```

The XML sitemap at `/sitemap.xml` reads currently published blogs from Supabase on each request. Drafts and future scheduled posts are omitted. `robots.txt` references the sitemap.
