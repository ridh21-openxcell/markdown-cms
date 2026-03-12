"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { visit } from "unist-util-visit";
import { MermaidBlock } from "./mermaid-block";
import type { Components } from "react-markdown";
import type { Root, RootContent } from "mdast";

interface MarkdownPreviewProps {
  content: string;
}

/**
 * Remark plugin that converts mermaid code blocks into custom div nodes
 * BEFORE rehype-highlight can touch them. The raw code string is preserved
 * exactly as the user typed it via a data attribute.
 */
function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang === "mermaid" && parent && typeof index === "number") {
        const replacement: RootContent = {
          type: "paragraph",
          data: {
            hName: "div",
            hProperties: {
              dataType: "mermaid",
              dataCode: node.value,
            },
          },
          children: [],
        };
        parent.children[index] = replacement as typeof parent.children[number];
      }
    });
  };
}

const components: Components = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  div(props: any) {
    const dataType = props.node?.properties?.dataType ?? props["data-type"] ?? props.dataType;
    const dataCode = props.node?.properties?.dataCode ?? props["data-code"] ?? props.dataCode;

    if (dataType === "mermaid" && typeof dataCode === "string") {
      return <MermaidBlock code={dataCode} />;
    }

    const { node, dataType: _dt, dataCode: _dc, ...rest } = props;
    void node;
    void _dt;
    void _dc;
    return <div {...rest} />;
  },
};

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Nothing to preview yet...
      </div>
    );
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMermaid]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
