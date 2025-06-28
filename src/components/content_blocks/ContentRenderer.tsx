import React from "react";
import { ContentBlock as ContentBlockData } from "../../types/data";
import TextBlock from "./TextBlock";
import CodeBlock from "./CodeBlock";
import ImageBlock from "./ImageBlock";

interface ContentRendererProps {
  content: ContentBlockData[];
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  return (
    <div>
      {content.map((block, index) => {
        switch (block.kind) {
          case "text":
            return <TextBlock key={index} block={block} />;
          case "code":
            return <CodeBlock key={index} block={block} />;
          case "image":
            return <ImageBlock key={index} block={block} />;
          default:
            // This is a safeguard for development
            const _exhaustiveCheck: never = block;
            console.warn("Unknown content block kind:", _exhaustiveCheck);
            return <div key={index}>Unsupported content block</div>;
        }
      })}
    </div>
  );
};

export default ContentRenderer;
