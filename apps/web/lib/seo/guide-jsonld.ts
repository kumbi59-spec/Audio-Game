import { getSiteUrl } from "@/lib/site-url";

export interface GuideFaq {
  question: string;
  answer: string;
}

/** BreadcrumbList for a guide under /seo: Home › Guides › the guide. */
export function guideBreadcrumbJsonLd(name: string, path: string) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/seo` },
      { "@type": "ListItem", position: 3, name, item: `${siteUrl}${path}` },
    ],
  };
}

/** FAQPage for a guide's visible Q&A section (the same text must be on the page). */
export function guideFaqJsonLd(path: string, faqs: GuideFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${getSiteUrl()}${path}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
