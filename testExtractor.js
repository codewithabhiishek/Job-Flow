import { urlExtractor } from './api/urlExtractor.js';
import fs from 'fs';

const testUrls = [
  { name: 'LinkedIn Job', url: 'https://www.linkedin.com/jobs/view/software-engineer-at-google-315891343' },
  { name: 'Greenhouse Job', url: 'https://boards.greenhouse.io/discord/jobs/6045938' },
  { name: 'Lever Job', url: 'https://jobs.lever.co/figma/f3366c8b-3db9-42b3-a178-0eecdbfcaf5a' },
  { name: 'Ashby Job', url: 'https://jobs.ashbyhq.com/notion/c1f6d395-5ab4-4f2b-8a4b-972175c5e8c1' },
  { name: 'Workday Job', url: 'https://netflix.myworkdayjobs.com/en-US/netflix_careers/job/Los-Gatos-California/Senior-Software-Engineer_JR11311' },
  { name: 'Generic Careers Page', url: 'https://www.netflix.com/jobs' },
  { name: 'Company Homepage', url: 'https://stripe.com' }
];

async function runTests() {
  let report = "# Extraction Test Report\n\n";

  for (const test of testUrls) {
    report += `## ${test.name}\n`;
    report += `- **URL:** ${test.url}\n`;
    report += `- **Detected as ATS Pattern:** ${urlExtractor.isKnownATS(test.url)}\n`;

    try {
      const payload = await urlExtractor.extract(test.url);
      report += `- **Status:** SUCCESS (Job Posting Detected)\n`;
      report += `- **Payload Length:** ${payload.length} characters\n`;
      report += `\n### Sent Payload Snippet (first 500 chars)\n\`\`\`\n${payload.substring(0, 500)}...\n\`\`\`\n\n`;
    } catch (e) {
      report += `- **Status:** REJECTED or FAILED\n`;
      report += `- **Error:** ${e.message}\n\n`;
    }
  }

  fs.writeFileSync('extraction_report.md', report);
  console.log("Report saved to extraction_report.md");
}

runTests();
