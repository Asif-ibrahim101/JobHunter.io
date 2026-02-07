console.log("JobAutomate: Content script loaded.");

/**
 * Parse relative date strings like "2 days ago", "1 week ago", "New" into ISO timestamps
 */
function parseRelativeDate(dateString) {
  if (!dateString) return new Date().toISOString();

  const now = new Date();
  const lowerStr = dateString.toLowerCase().trim();

  // Handle "New", "Just now", "Today"
  if (lowerStr === 'new' || lowerStr === 'just now' || lowerStr === 'today' || lowerStr === 'just posted') {
    return now.toISOString();
  }

  // Handle "Yesterday"
  if (lowerStr === 'yesterday') {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }

  // Handle "X days ago", "X day ago"
  const daysMatch = lowerStr.match(/(\d+)\s*days?\s*ago/);
  if (daysMatch) {
    now.setDate(now.getDate() - parseInt(daysMatch[1], 10));
    return now.toISOString();
  }

  // Handle "X weeks ago", "X week ago"
  const weeksMatch = lowerStr.match(/(\d+)\s*weeks?\s*ago/);
  if (weeksMatch) {
    now.setDate(now.getDate() - parseInt(weeksMatch[1], 10) * 7);
    return now.toISOString();
  }

  // Handle "X months ago", "X month ago"
  const monthsMatch = lowerStr.match(/(\d+)\s*months?\s*ago/);
  if (monthsMatch) {
    now.setMonth(now.getMonth() - parseInt(monthsMatch[1], 10));
    return now.toISOString();
  }

  // Handle "X hours ago", "X hour ago"
  const hoursMatch = lowerStr.match(/(\d+)\s*hours?\s*ago/);
  if (hoursMatch) {
    now.setHours(now.getHours() - parseInt(hoursMatch[1], 10));
    return now.toISOString();
  }

  // Handle "X minutes ago"
  const minutesMatch = lowerStr.match(/(\d+)\s*minutes?\s*ago/);
  if (minutesMatch) {
    now.setMinutes(now.getMinutes() - parseInt(minutesMatch[1], 10));
    return now.toISOString();
  }

  // Default to now if we can't parse
  return now.toISOString();
}

// Function to extract job data from LinkedIn
function extractLinkedInJobData() {
  console.log("JobAutomate: Attempting to extract LinkedIn data...");

  const jobData = {
    title: "",
    company: "",
    location: "",
    description: "",
    source: "LinkedIn",
    url: window.location.href,
    created_at: new Date().toISOString()
  };

  // Helper to try multiple selectors and return first match
  const getElement = (selectorList) => {
    for (const selector of selectorList) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          console.log(`JobAutomate: Found element with selector: ${selector}`);
          return el;
        }
      } catch (e) {
        console.log(`JobAutomate: Invalid selector: ${selector}`);
      }
    }
    return null;
  };

  const getText = (selectorList) => {
    const el = getElement(selectorList);
    if (el) {
      // Use innerText for better formatting (respects visibility and line breaks)
      return el.innerText?.trim() || el.textContent?.trim() || "";
    }
    return "";
  };

  // Title selectors
  const titleSelectors = [
    '.job-details-jobs-unified-top-card__job-title h1',
    '.job-details-jobs-unified-top-card__job-title',
    'h1.top-card-layout__title',
    '.jobs-unified-top-card__job-title',
    'h1[class*="job-title"]',
    'h2.t-24',
    '.t-24.job-details-jobs-unified-top-card__job-title'
  ];

  // Company selectors
  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
    '.top-card-layout__first-subline .topcard__org-name-link',
    'a[class*="company-name"]'
  ];

  // Location selectors
  const locationSelectors = [
    '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    '.top-card-layout__first-subline .topcard__flavor--bullet',
    '.job-card-container__metadata-item',
    'span[class*="location"]',
    '.jobs-unified-top-card__workplace-type'
  ];

  // Description selectors - the job description content
  const descriptionSelectors = [
    '#job-details',
    '#job-details > span',
    '.jobs-description__content .jobs-box__html-content',
    '.jobs-description-content__text',
    '.jobs-description__content',
    '.show-more-less-html__markup',
    '.jobs-box__html-content',
    'article.jobs-description__container',
    '[class*="jobs-description"]',
    '.description__text'
  ];

  // Posted date selectors - LinkedIn shows "Posted X days ago", "Reposted X days ago", etc.
  const postedDateSelectors = [
    '.job-details-jobs-unified-top-card__primary-description-container .tvm__text--low-emphasis',
    '.jobs-unified-top-card__posted-date',
    '.posted-time-ago__text',
    'span.jobs-unified-top-card__subtitle-secondary-grouping span',
    '[class*="posted"]',
    'time'
  ];

  // Extract title
  jobData.title = getText(titleSelectors);

  // Extract company
  jobData.company = getText(companySelectors);

  // Extract location - try direct selectors first
  jobData.location = getText(locationSelectors);

  // If location is empty, try parsing from primary description container
  if (!jobData.location) {
    const primaryDesc = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
    if (primaryDesc) {
      const spans = primaryDesc.querySelectorAll('span.tvm__text');
      if (spans.length > 0) {
        jobData.location = spans[0].innerText?.trim() || "";
      }
    }
  }

  // Extract description
  jobData.description = getText(descriptionSelectors);

  // Extract posted date
  let postedDateRaw = getText(postedDateSelectors);

  // Try to find date in the primary description container if not found
  if (!postedDateRaw) {
    const primaryDesc = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
    if (primaryDesc) {
      const allText = primaryDesc.innerText || '';
      // Look for patterns like "Posted 2 days ago", "Reposted 1 week ago"
      const match = allText.match(/(posted|reposted)?\s*(\d+\s*(days?|weeks?|months?|hours?)\s*ago|yesterday|today|just now)/i);
      if (match) {
        postedDateRaw = match[0];
      }
    }
  }

  if (postedDateRaw) {
    jobData.created_at = parseRelativeDate(postedDateRaw);
    console.log("JobAutomate: Parsed posted date:", postedDateRaw, "->", jobData.created_at);
  }

  // Debug: Log all potential description containers
  console.log("JobAutomate: Searching for description elements...");
  const potentialDescContainers = document.querySelectorAll('[id*="job"], [class*="description"], [class*="jobs-box"]');
  console.log(`JobAutomate: Found ${potentialDescContainers.length} potential containers`);
  potentialDescContainers.forEach((el, i) => {
    if (el.innerText && el.innerText.length > 200) {
      console.log(`JobAutomate: Container ${i}: id="${el.id}", class="${el.className.substring(0, 100)}..."`);
    }
  });

  // Fallback: Find any large text block that might be the description
  if (!jobData.description) {
    console.log("JobAutomate: Using fallback description search...");
    const allDivs = document.querySelectorAll('div, article, section');
    for (const div of allDivs) {
      const text = div.innerText?.trim() || "";
      // Job descriptions are typically 200+ characters
      if (text.length > 200 && text.length < 15000) {
        // Check if it looks like a job description (contains common keywords)
        const lowerText = text.toLowerCase();
        if (lowerText.includes('responsibilities') ||
            lowerText.includes('requirements') ||
            lowerText.includes('qualifications') ||
            lowerText.includes('experience') ||
            lowerText.includes('skills') ||
            lowerText.includes('about the role') ||
            lowerText.includes('job description')) {
          // Make sure we're not grabbing the whole page
          if (!div.querySelector('header') && !div.querySelector('nav')) {
            jobData.description = text;
            console.log(`JobAutomate: Found description via fallback, length: ${text.length}`);
            break;
          }
        }
      }
    }
  }

  console.log("JobAutomate: Extracted Data:", jobData);
  console.log("JobAutomate: Description length:", jobData.description.length);
  return jobData;
}

// Listen for messages from the popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_job") {
    const data = extractLinkedInJobData();
    sendResponse({ status: "success", data: data });
  }
});
