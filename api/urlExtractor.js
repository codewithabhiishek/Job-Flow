import * as cheerio from 'cheerio';
import dns from 'dns/promises';

export class UrlExtractor {
  
  /**
   * Determine if a URL belongs to a known ATS or job posting pattern.
   */
  isKnownATS(urlStr) {
    const u = new URL(urlStr);
    const domain = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    
    // Greenhouse
    if (domain.includes('boards.greenhouse.io') && path.includes('/jobs/')) return true;
    
    // Lever
    if (domain.includes('jobs.lever.co') && path.split('/').length >= 3) return true;
    
    // Ashby
    if (domain.includes('jobs.ashbyhq.com') && path.split('/').length >= 3) return true;
    
    // Workday (usually myworkdayjobs.com/.../job/...)
    if (domain.includes('myworkdayjobs.com') && path.includes('/job/')) return true;
    
    // LinkedIn
    if (domain.includes('linkedin.com') && (path.includes('/jobs/view/') || path.includes('/jobs/search'))) {
      // NOTE: LinkedIn often blocks automated fetching or returns generic auth walls.
      // But we will allow the URL pattern.
      return true;
    }
    
    // Generic patterns for custom careers pages
    // e.g. /careers/job/123, /jobs/software-engineer
    if (path.match(/\/(jobs|careers|openings)\/[a-zA-Z0-9-]+\/?$/)) return true;
    if (path.match(/\/(job|posting)\/[a-zA-Z0-9-]+\/?$/)) return true;
    
    return false;
  }

  /**
   * Extract JSON-LD JobPosting schema if it exists.
   */
  extractJsonLd($) {
    let jobData = null;
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const text = $(el).html();
        const parsed = JSON.parse(text);
        
        const checkNode = (node) => {
          if (node['@type'] === 'JobPosting') {
            jobData = node;
          } else if (Array.isArray(node)) {
            node.forEach(checkNode);
          } else if (node && typeof node === 'object' && node['@graph']) {
            checkNode(node['@graph']);
          }
        };
        
        checkNode(parsed);
      } catch (e) {
        // ignore parse errors
      }
    });
    return jobData;
  }

  /**
   * Clean HTML by removing non-content nodes to leave a focused description.
   */
  cleanHtml($) {
    // Remove totally useless tags
    $('script, style, noscript, iframe, svg, img, video, audio, link, meta, head').remove();
    
    // Remove UI elements
    $('nav, header, footer, aside').remove();
    $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
    
    // Remove generic noise by class/id substrings
    const noiseSelectors = [
      '#cookie-banner', '.cookie-banner', '#consent', '.consent',
      '.sidebar', '#sidebar', '.recommendations', '.related-jobs',
      '.similar-jobs', '.newsletter', '.subscribe', '.social-share',
      '.job-alerts', '.apply-now-top', '.navigation', '.menu'
    ];
    $(noiseSelectors.join(', ')).remove();
    
    // Attempt to isolate main content area
    let mainContent = $('main');
    if (mainContent.length === 0) {
      mainContent = $('[role="main"]');
    }
    if (mainContent.length === 0) {
      mainContent = $('#app-body, #content, .posting-page, .job-description, #job-details, .application-form');
    }
    
    if (mainContent.length > 0) {
      return mainContent.text().replace(/\s+/g, ' ').trim();
    }
    
    // Fallback: whole body text
    return $('body').text().replace(/\s+/g, ' ').trim();
  }

  /**
   * Reject any URL that is not a public HTTP(S) host. Re-validated on every
   * redirect hop so a redirect chain cannot be used to reach internal networks
   * after the initial check (DNS-rebinding / redirect SSRF).
   */
  async assertSafeUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr);
    } catch {
      throw new Error("Invalid URL provided.");
    }

    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error("Invalid URL protocol. Only HTTP and HTTPS are allowed.");
    }

    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1') {
      throw new Error("Access to localhost is forbidden.");
    }

    try {
      const addresses = await dns.resolve(u.hostname);
      for (const ip of addresses) {
        if (/^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(ip) || ip === '::1' || ip === '0:0:0:0:0:0:0:1') {
          throw new Error("Access to private or internal network addresses is forbidden.");
        }
      }
    } catch (err) {
      if (err.message.includes("forbidden")) throw err;
      throw new Error("Failed to resolve hostname or invalid domain.");
    }
  }

  /**
   * Fetch without auto-following redirects (so we control each hop), with a
   * hard timeout and an upper bound on page size.
   */
  async fetchWithTimeout(urlStr, headers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(urlStr, { headers, redirect: 'manual', signal: controller.signal });
      const length = res.headers.get('content-length');
      if (length && Number(length) > 2 * 1024 * 1024) {
        throw new Error("Page exceeds the maximum allowed size.");
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async extract(urlStr) {
    // Follow redirects manually, validating each hop against SSRF rules.
    let current = urlStr;
    let redirects = 0;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };

    let response;
    for (;;) {
      await this.assertSafeUrl(current);
      response = await this.fetchWithTimeout(current, headers);
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error("Redirect response without a Location header.");
        }
        if (++redirects > 5) {
          throw new Error("Too many redirects (max 5).");
        }
        current = new URL(location, current).toString();
        continue;
      }
      break;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch page. Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 2. Extract Metadata
    const title = $('title').text().toLowerCase();
    const ogTitle = $('meta[property="og:title"]').attr('content') || "";
    const jsonLd = this.extractJsonLd($);
    
    // 3. Strict Verification
    const isATS = this.isKnownATS(current);
    let isJobPosting = isATS;
    if (jsonLd) {
      isJobPosting = true; // JobPosting schema present
    } else {
      // Check title for generic patterns indicating a non-job page
      const genericKeywords = ['careers', 'jobs', 'about us', 'team', 'engineering blog', 'home'];
      const isGeneric = genericKeywords.some(kw => title === kw || title.startsWith(`${kw} |`));
      
      const hasJobKeywords = title.includes('engineer') || title.includes('manager') || 
                             title.includes('developer') || title.includes('designer') || 
                             title.includes('analyst');
      
      if (isGeneric && !hasJobKeywords && !isATS) {
        throw new Error("This URL is not an individual job posting.");
      }
      
      // If no JSON-LD and not a known ATS, use a loose heuristic based on title length or keywords
      // But we will allow it to proceed and let the LLM decide if it's too ambiguous, 
      // UNLESS it's definitely a homepage (e.g. path is just / or /careers)
      if (new URL(current).pathname === '/' || new URL(current).pathname === '/careers' || new URL(current).pathname === '/jobs') {
        throw new Error("This URL is not an individual job posting.");
      }
    }
    
    // 4. Clean HTML
    const cleanText = this.cleanHtml($);
    
    // 5. Construct final prompt string to send to AI
    let structuredPayload = "Job URL: " + current + "\\n\\n";
    
    if (jsonLd) {
      structuredPayload += "=== STRUCTURED METADATA ===\\n";
      if (jsonLd.title) structuredPayload += `Title: ${jsonLd.title}\\n`;
      if (jsonLd.hiringOrganization?.name) structuredPayload += `Company: ${jsonLd.hiringOrganization.name}\\n`;
      if (jsonLd.jobLocation) structuredPayload += `Location: ${JSON.stringify(jsonLd.jobLocation)}\\n`;
      if (jsonLd.employmentType) structuredPayload += `Employment Type: ${jsonLd.employmentType}\\n`;
      if (jsonLd.baseSalary) structuredPayload += `Salary: ${JSON.stringify(jsonLd.baseSalary)}\\n`;
      if (jsonLd.validThrough) structuredPayload += `Deadline: ${jsonLd.validThrough}\\n`;
      structuredPayload += "===========================\\n\\n";
    }
    
    structuredPayload += "=== PAGE CONTENT ===\\n";
    // Truncate text if it's absurdly long to prevent token overflow
    structuredPayload += cleanText.substring(0, 15000);
    
    return structuredPayload;
  }
}

export const urlExtractor = new UrlExtractor();
