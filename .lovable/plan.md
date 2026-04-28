I found the cause: the Help Centre database tables currently have 0 articles and 0 categories, so `/help` renders the shell/search but has no content to list.

Plan to fix it:

1. Add starter Help Centre content
   - Create a safe database migration that inserts a useful set of published help articles and categories for Punchly/Oqlio.
   - Include categories like Getting Started, Attendance, Mobile App, Admin Settings, Billing, Integrations, and Troubleshooting.
   - Give each article a slug, title, excerpt, body, category, status `published`, position, SEO title/description, and published timestamp.

2. Make the public Help page less confusing when content is missing
   - Update `/help` to show a clear empty-state message if no published articles exist, instead of looking broken.
   - Keep “Contact support” available from the empty state.

3. Verify the Help Centre data path
   - Confirm `/help` loads published articles from the database.
   - Confirm category cards, popular articles, article links, search, and `/help/{slug}` pages work with the seeded content.
   - Run typecheck/build checks after the changes.

Technical notes:
- This uses the existing `kb_articles` and `kb_categories` tables and existing RLS policies.
- No change is needed to authentication for public viewing; published articles are already public.
- This does not try to fix `help.oqlio.com` at DNS/hosting level. It fixes the working path-based Help Centre at `https://oqlio.com/help` and the preview `/help` route.