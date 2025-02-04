export function generateKbUrl(category: string, title: string): string {
  const baseUrl = 'https://githedgehog.com/kb';
  const slugifiedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  return `${baseUrl}/${category.toLowerCase()}/${slugifiedTitle}`;
}

export function shouldUpdateKbUrl(currentUrl: string | null): boolean {
  if (!currentUrl) return true;
  
  const pattern = /^https:\/\/githedgehog\.com\/kb\/[^/]+\/.+/;
  return !pattern.test(currentUrl);
}
