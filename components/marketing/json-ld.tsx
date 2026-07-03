// Tiny JSON-LD renderer (server component). Data is server-controlled (never user input), so the
// script injection is safe. Used for Organization (home) and FAQPage (/faq) structured data.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
