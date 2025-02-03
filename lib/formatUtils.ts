/**
 * Utility functions for formatting KB entry fields according to Hubspot requirements
 */

/**
 * Format title to be plain text with lowercase and hyphens
 */
export function formatKbTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

/**
 * Format subtitle to be plain text only
 */
export function formatKbSubtitle(subtitle: string): string {
  return subtitle
    .trim()
    .replace(/[<>]/g, '') // Remove any HTML tags
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\*/g, '') // Remove markdown italic
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/`/g, ''); // Remove code blocks
}

/**
 * Format body content to use Hubspot's hybrid HTML/Markdown format
 */
export function formatKbBody(body: string): string {
  // Ensure paragraphs are wrapped in <p> tags
  let formatted = body
    .split('\n\n')
    .map(para => para.trim())
    .filter(para => para)
    .map(para => {
      // Don't wrap if it's already an HTML tag
      if (para.startsWith('<') && para.endsWith('>')) {
        return para;
      }
      return `<p>${para}</p>`;
    })
    .join('\n\n');

  // Replace regular line breaks with HTML breaks
  formatted = formatted.replace(/(?<!\>)\n(?!\<)/g, '<br>');

  // Ensure proper spacing after HTML breaks
  formatted = formatted.replace(/<br><br>/g, '</p>\n\n<p>');

  // Keep markdown bold syntax
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '**$1**');

  return formatted;
}

/**
 * Format LLM response to match Hubspot formatting requirements
 */
export function formatLlmResponse(response: string): {
  title?: string;
  subtitle?: string;
  body?: string;
} {
  const titleMatch = response.match(/TITLE:\s*([^\n]+)/);
  const subtitleMatch = response.match(/SUBTITLE:\s*([^\n]+)/);
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)$/);

  return {
    title: titleMatch ? formatKbTitle(titleMatch[1]) : undefined,
    subtitle: subtitleMatch ? formatKbSubtitle(subtitleMatch[1]) : undefined,
    body: bodyMatch ? formatKbBody(bodyMatch[1]) : undefined,
  };
}
