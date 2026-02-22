"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

type RichEditorProps = {
  initialContent: string;
  onChange: (html: string) => void;
  editable?: boolean;
};

export function RichEditor({ initialContent, onChange, editable = true }: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image, TextStyle, Color],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none min-h-[26rem] p-6 focus:outline-none " +
          "prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-6 prose-h3:mt-4 " +
          "prose-p:leading-7 prose-figure:my-5 prose-img:rounded-lg prose-figcaption:text-xs prose-figcaption:text-muted-foreground",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  return <EditorContent editor={editor} />;
}
