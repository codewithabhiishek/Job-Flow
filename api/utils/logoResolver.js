/**
 * Resolves a company's logo URL based on their website domain or company name.
 * We use Clearbit's autocomplete API to infer domains from names,
 * and Clearbit's logo API to fetch the logo.
 */

// Basic TLDs and common domains we should ignore when trying to extract domain from a URL
const IGNORED_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'naukri.com', 
  'wellfound.com', 'angel.co', 'ycombinator.com', 'workday.com',
  'greenhouse.io', 'lever.co', 'myworkdayjobs.com', 'instahyre.com',
  'google.com'
];

/**
 * Extracts a root domain from a given URL if possible.
 */
function extractDomain(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, '');
    
    // Ignore job board domains, since those aren't the company's actual website.
    // E.g. linkedin.com/jobs/view/... -> we want the company logo, not LinkedIn's logo!
    // Except if the company name IS exactly LinkedIn, but that's handled by name inference.
    if (IGNORED_DOMAINS.includes(domain)) {
      return null;
    }
    
    return domain;
  } catch (e) {
    return null; // Invalid URL
  }
}

/**
 * Uses Clearbit Autocomplete API to find a domain from a company name.
 */
async function inferDomainFromName(name) {
  if (!name || name.trim().length < 2) return null;
  
  try {
    // Note: Clearbit Autocomplete is unauthenticated and free.
    const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name.trim())}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data.length > 0 && data[0].domain) {
      return data[0].domain;
    }
    return null;
  } catch (e) {
    console.error(`[LogoResolver] Error inferring domain for ${name}:`, e.message);
    return null;
  }
}

/**
 * Checks if a logo exists for a given domain by making a HEAD request.
 */
async function validateLogo(domain) {
  if (!domain) return null;
  
  const logoUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;
  try {
    const res = await fetch(logoUrl, { method: 'HEAD' });
    if (res.ok) {
      return logoUrl;
    }
    return null;
  } catch (e) {
    console.error(`[LogoResolver] Error validating logo for ${domain}:`, e.message);
    return null;
  }
}

/**
 * Main function: resolves a logo URL for a company.
 * Returns the logo URL or "failed" if no logo could be found.
 */
export async function resolveCompanyLogo(companyName, jobUrl) {
  let domain = extractDomain(jobUrl);
  
  if (!domain) {
    domain = await inferDomainFromName(companyName);
  }
  
  if (!domain) {
    return "failed";
  }
  
  const logoUrl = await validateLogo(domain);
  return logoUrl || "failed";
}
