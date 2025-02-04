/**
 * Utility functions for formatting KB entry fields according to Hubspot requirements
 */

/**
 * Format title to be plain text
 */
export function formatKbTitle(title: string): string {
  return title.trim(); // Only trim whitespace, preserve original text
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
 * Format body content to use Hubspot's allowed HTML format
 */
export function formatKbBody(body: string): string {
  // List of allowed HTML tags and their attributes
  const allowedTags = {
    p: ['style'], // Supports text-align and padding-left
    h3: [],
    h4: [],
    blockquote: [],
    pre: [],
    strong: [],
    em: [],
    span: ['style'], // Supports text-decoration
    ul: [],
    ol: [],
    li: [],
    sup: [],
    sub: [],
    code: [],
    a: ['href', 'rel', 'target'],
    br: []
  };

  // Common text alignments
  const alignments = {
    center: 'text-align: center;',
    right: 'text-align: right;',
    justify: 'text-align: justify;'
  };

  // Text decorations
  const decorations = {
    underline: 'text-decoration: underline;',
    strikethrough: 'text-decoration: line-through;'
  };

  // Ensure paragraphs are wrapped in <p> tags
  let formatted = body
    .split('\n\n')
    .map(para => para.trim())
    .filter(para => para)
    .map(para => {
      // Don't wrap if it's already an HTML block-level tag
      if (para.match(/^<(p|h[34]|blockquote|pre|[ou]l)[\s>]/)) {
        return para;
      }
      return `<p>${para}</p>`;
    })
    .join('\n\n');

  // Replace regular line breaks with HTML breaks
  formatted = formatted.replace(/(?<!\>)\n(?!\<)/g, '<br>');

  // Convert markdown bold to HTML
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert markdown italic to HTML
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert markdown code to HTML
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert markdown links to HTML
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" rel="noopener">$1</a>'
  );

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
