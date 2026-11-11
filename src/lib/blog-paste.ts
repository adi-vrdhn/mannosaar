import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
const allowedTags = new Set(['P', 'DIV', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'A', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'HR', 'SPAN', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SUP', 'SUB']);
const dropTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'TEMPLATE', 'LINK', 'META']);
const allowedStyles = new Set(['font-family', 'font-size', 'font-weight', 'font-style', 'color', 'background-color', 'text-decoration', 'text-align', 'line-height']);

export function clipboardHtml(richHtml: string, plainText: string, document: Document): string {
  // ChatGPT's Copy button can supply Markdown as plain text; selecting text can supply HTML.
  const hasSemanticHtml = /<\s*(h[1-6]|a|strong|b|em|i|ul|ol|li|blockquote|pre|code|table)\b/i.test(richHtml);
  const hasStyledHtml = /<\s*span\b[^>]*style\s*=/i.test(richHtml);
  const hasMarkdownSyntax = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^)]+)\)/m.test(plainText);
  if (!richHtml || (!hasSemanticHtml && (hasMarkdownSyntax || !hasStyledHtml))) return markdown.render(plainText);

  const template = document.createElement('template');
  template.innerHTML = richHtml;
  for (const element of Array.from(template.content.querySelectorAll('*'))) {
    if (dropTags.has(element.tagName)) { element.remove(); continue; }
    if (!allowedTags.has(element.tagName)) { element.replaceWith(...Array.from(element.childNodes)); continue; }
    const href = element.tagName === 'A' ? element.getAttribute('href') : null;
    const styles: string[] = [];
    const styled = element as HTMLElement;
    for (const property of Array.from(styled.style)) {
      const value = styled.style.getPropertyValue(property);
      if (allowedStyles.has(property) && !/(?:url|expression)\s*\(|[<>]/i.test(value)) styles.push(`${property}: ${value}`);
    }
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
    if (href && /^(https?:|mailto:|\/)/i.test(href)) {
      element.setAttribute('href', href);
      element.setAttribute('rel', 'noopener noreferrer');
    }
    if (styles.length) element.setAttribute('style', styles.join('; '));
  }
  return template.innerHTML;
}

export function insertClipboardHtml(editor: HTMLElement, html: string, document: Document) {
  editor.focus();
  const selection = document.getSelection();
  if (!selection?.rangeCount) { editor.insertAdjacentHTML('beforeend', html); return; }
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) { editor.insertAdjacentHTML('beforeend', html); return; }
  const fragment = range.createContextualFragment(html);
  const lastNode = fragment.lastChild;
  range.deleteContents();
  range.insertNode(fragment);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
