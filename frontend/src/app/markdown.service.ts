import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  render(markdown: string): string {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let listType: "ul" | "ol" | null = null;

    const closeList = () => {
      if (listType) {
        html += `</${listType}>`;
        listType = null;
      }
    };

    const openList = (type: "ul" | "ol") => {
      if (listType == type) {
        return;
      }

      closeList();
      html += `<${type}>`;
      listType = type;
    };

    lines.forEach(line => {
      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      const unorderedListItem = /^[-*]\s+(.+)$/.exec(line);
      const orderedListItem = /^\d+[.)]\s+(.+)$/.exec(line);

      if (unorderedListItem) {
        openList("ul");
        html += `<li>${this.renderInline(unorderedListItem[1])}</li>`;
        return;
      }

      if (orderedListItem) {
        openList("ol");
        html += `<li>${this.renderInline(orderedListItem[1])}</li>`;
        return;
      }

      closeList();

      if (heading) {
        const level = heading[1].length;
        html += `<h${level}>${this.renderInline(heading[2])}</h${level}>`;
      }
      else if (line.trim()) {
        html += `<p>${this.renderInline(line)}</p>`;
      }
      else {
        html += "<br>";
      }
    });

    closeList();
    return html;
  }

  renderInline(text: string): string {
    const anchors: string[] = [];
    const textWithAnchorTokens = this.extractHtmlAnchors(text, anchors);

    let html = this.escapeHtml(textWithAnchorTokens)
      .replace(/`(.+?)`/g, (_match, code) => `<code>${code}</code>`)
      .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_match, label, href, title) =>
        this.buildAnchor(this.renderInline(label), this.decodeBasicHtml(href), title ? this.decodeBasicHtml(title) : "")
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

    anchors.forEach((anchor, index) => {
      html = html.replace(`@@PS_LINK_${index}@@`, anchor);
    });

    return html;
  }

  private extractHtmlAnchors(text: string, anchors: string[]): string {
    return text.replace(/<a\s+[^>]*href\s*=\s*(['"])(.*?)\1[^>]*>(.*?)<\/a>/gi, (_match, _quote, href, label) => {
      const token = `@@PS_LINK_${anchors.length}@@`;
      anchors.push(this.buildAnchor(this.renderInline(this.stripHtml(label)), href, ""));
      return token;
    });
  }

  private buildAnchor(labelHtml: string, href: string, title: string): string {
    const safeHref = this.getSafeHref(href);
    if (!safeHref) {
      return labelHtml;
    }

    const titleAttribute = title ? ` title="${this.escapeHtml(title)}"` : "";
    return `<a href="${this.escapeHtml(safeHref)}"${titleAttribute} target="_blank" rel="noopener noreferrer">${labelHtml}</a>`;
  }

  private getSafeHref(href: string): string | null {
    const trimmed = href.trim();
    if (/^(https?:\/\/|mailto:|\/|#)/i.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, "");
  }

  private decodeBasicHtml(text: string): string {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
