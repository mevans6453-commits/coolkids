/**
 * Test script — manually tests the event parser against
 * real markdown content from a venue website.
 * 
 * Run with: npx tsx src/scripts/test-scrape.ts
 */

import { parseEventsFromMarkdown } from "../scrapers/apify-scraper";

// Sample markdown from Tellus Science Museum (scraped via Apify)
const sampleMarkdown = `
### [Members Only Story Time](https://tellusmuseum.org/our-events/members-only-story-time-when-spring-comes/)

19 Mar

Thursday, March 19, 2026
9:30 AM

[Learn More](https://tellusmuseum.org/our-events/members-only-story-time-when-spring-comes/)

### [A Crystal Clear Perspective From Space](https://tellusmuseum.org/our-events/a-crystal-clear-perspective-from-space/)

21 Mar

Saturday, March 21, 2026
11 AM – 1:30 PM

[Learn More](https://tellusmuseum.org/our-events/a-crystal-clear-perspective-from-space/)

### [Solar Sky Watch](https://tellusmuseum.org/our-events/solar-sky-watch-march-21/)

21 Mar

Saturday, March 21, 2026
12 – 4 PM

[Learn More](https://tellusmuseum.org/our-events/solar-sky-watch-march-21/)

### [Evening Sky Watch](https://tellusmuseum.org/our-events/evening-sky-watch-march-27/)

27 Mar

Friday, March 27, 2026
8 – 11 PM

[Learn More](https://tellusmuseum.org/our-events/evening-sky-watch-march-27/)

### [Bank of America Museums On Us Weekend](https://tellusmuseum.org/our-events/bank-of-america-museums-on-us-saturday/)

4 Apr

Saturday, April 4, 2026

[Learn More](https://tellusmuseum.org/our-events/bank-of-america-museums-on-us-saturday/)

### [Science Explorer Camp: Phenomenal Science](https://tellusmuseum.org/our-events/science-explorer-camp-phenomenal-science/)

1 Jun

Monday, June 1, 2026
through Friday, June 5, 2026

[Learn More](https://tellusmuseum.org/our-events/science-explorer-camp-phenomenal-science/)

### GET YOUR TICKETS TODAY!

### BECOME A MEMBER
`;

console.log("Testing event parser with Tellus Science Museum data...\n");

const events = parseEventsFromMarkdown(sampleMarkdown, ["museum", "education"]);

console.log(`Found ${events.length} events:\n`);

for (const event of events) {
  console.log(`  Name: ${event.name}`);
  console.log(`  Date: ${event.start_date}${event.end_date ? " to " + event.end_date : ""}`);
  console.log(`  Time: ${event.start_time || "N/A"}${event.end_time ? " - " + event.end_time : ""}`);
  console.log(`  URL:  ${event.source_url || "N/A"}`);
  console.log(`  Free: ${event.is_free}`);
  console.log(`  Categories: ${event.categories.join(", ")}`);
  console.log("");
}
