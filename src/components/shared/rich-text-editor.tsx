"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite o conteúdo...",
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-56 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gym-accent/40",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
        <ToolbarButton
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Negrito"
        />
        <ToolbarButton
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Itálico"
        />
        <ToolbarButton
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Lista"
        />
        <ToolbarButton
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Num."
        />
        <ToolbarButton
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Título"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="Linha"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => editor.chain().focus().undo().run()}
          label="Desfazer"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => editor.chain().focus().redo().run()}
          label="Refazer"
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 border-border px-2 text-xs",
        pressed ? "bg-gym-accent/10 text-gym-accent" : "text-muted-foreground"
      )}
    >
      {label}
    </Button>
  );
}
