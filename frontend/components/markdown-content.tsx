import type { ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type MarkdownContentProps = { content: string; className?: string };

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const blocks: ReactNode[] = [];
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  let paragraph: string[] = [];
  let list: ListItem[] = [];
  let code: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(<List key={`list-${blocks.length}`} items={list} />);
      list = [];
    }
  };
  const flushCode = () => {
    if (code.length) {
      blocks.push(<pre key={`pre-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
      code = [];
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCode) flushCode();
      else { flushParagraph(); flushList(); }
      inCode = !inCode;
      return;
    }
    if (inCode) { code.push(line); return; }
    if (!line.trim()) { flushParagraph(); flushList(); return; }
    if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) { flushParagraph(); flushList(); blocks.push(<hr key={`hr-${blocks.length}`} />); return; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      blocks.push(<Tag key={`h-${blocks.length}`}>{inlineMarkdown(heading[2])}</Tag>);
      return;
    }
    const displayMath = line.match(/^\s*\$\$(.+)\$\$\s*$/);
    if (displayMath) { flushParagraph(); flushList(); blocks.push(<div key={`math-${blocks.length}`} className="markdown-math" dangerouslySetInnerHTML={{ __html: renderMath(displayMath[1], true) }} />); return; }
    const item = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (item) { flushParagraph(); list.push({ indent: item[1].length, ordered: /\d/.test(item[2]), text: item[3] }); return; }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) { flushParagraph(); flushList(); blocks.push(<blockquote key={`quote-${blocks.length}`}>{inlineMarkdown(quote[1])}</blockquote>); return; }
    flushList();
    paragraph.push(line);
  });
  if (inCode) flushCode();
  flushParagraph();
  flushList();

  return <div className={`markdown-content ${className}`}>{blocks}</div>;
}

function inlineMarkdown(value: string): ReactNode[] {
  const parts = value.split(/(!\[[^\]]*\]\((?:https?:\/\/|\/)[^\)]+\)|\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\$[^$]+\$|\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, index) => {
    const image = part.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\)]+)\)$/);
    if (image) return <img key={index} src={image[2]} alt={image[1]} loading="lazy" />;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <del key={index}>{part.slice(2, -2)}</del>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("$") && part.endsWith("$")) return <span key={index} className="markdown-math" dangerouslySetInnerHTML={{ __html: renderMath(part.slice(1, -1), false) }} />;
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  });
}

function renderMath(value: string, displayMode: boolean) {
  try { return katex.renderToString(value, { displayMode, throwOnError: false, strict: "ignore" }); }
  catch { return value; }
}

type ListItem = { indent: number; ordered: boolean; text: string; children?: ListItem[] };

function List({ items }: { items: ListItem[] }) {
  const roots: ListItem[] = [];
  const stack: ListItem[] = [];
  items.forEach((item) => {
    const current = { ...item, children: [] as ListItem[] };
    while (stack.length && stack[stack.length - 1].indent >= current.indent) stack.pop();
    if (stack.length) stack[stack.length - 1].children?.push(current);
    else roots.push(current);
    stack.push(current);
  });
  return <ListGroup items={roots} />;
}

function ListGroup({ items }: { items: ListItem[] }) {
  if (!items.length) return null;
  const Tag = items[0].ordered ? "ol" : "ul";
  return <Tag>{items.map((item, index) => <li key={`${item.text}-${index}`}>{inlineMarkdown(item.text)}{item.children?.length ? <ListGroup items={item.children} /> : null}</li>)}</Tag>;
}
