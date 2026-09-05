import HydTechPulse from "@/components/HydTechPulse";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HydStartupMap",
  url: "https://hydstartupmap.com",
  description: "Hyderabad startup map with real careers pages, sourced news, and corridor hiring heat.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://hydstartupmap.com/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HydTechPulse />
    </>
  );
}
