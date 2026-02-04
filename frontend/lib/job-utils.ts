export const normalizeSource = (source?: string) => {
  if (!source) return '';
  const cleaned = source.trim();
  if (!cleaned) return '';
  const lower = cleaned.toLowerCase();
  if (lower.includes('linkedin')) return 'LinkedIn';
  if (lower.includes('glassdoor')) return 'Glassdoor';
  return cleaned;
};

export const normalizeLogoUrl = (logo?: string, source?: string) => {
  if (!logo) return '';
  let url = logo.trim();
  if (!url) return '';

  if (url.startsWith('http://')) {
    url = `https://${url.slice(7)}`;
  }

  if (url.startsWith('//')) {
    url = `https:${url}`;
  }

  if (url.startsWith('/')) {
    const sourceLower = source?.toLowerCase() || '';
    const base =
      sourceLower.includes('glassdoor')
        ? 'https://www.glassdoor.co.uk'
        : sourceLower.includes('linkedin')
          ? 'https://www.linkedin.com'
          : '';
    if (!base) return '';
    url = `${base}${url}`;
  }

  return url;
};
