"use client";

import { type ReactNode, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
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
      Link.configure({
        openOnClick: true,
        autolink: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "focus-ring-brand min-h-72 w-full rounded-b-xl border-x border-b border-border bg-secondary/30 px-5 py-4 text-sm text-foreground outline-none",
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
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        "[&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold",
        "[&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold",
        "[&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold",
        "[&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-7",
        "[&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
        "[&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
        "[&_.ProseMirror_hr]:my-4 [&_.ProseMirror_hr]:border-border",
        "[&_.ProseMirror_a]:text-gym-accent [&_.ProseMirror_a]:underline",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-2 py-2">
        <ToolbarButton
          pressed={false}
          onClick={() => editor.chain().focus().undo().run()}
          icon={<Undo2 className="size-4" />}
          label="Desfazer"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => editor.chain().focus().redo().run()}
          icon={<Redo2 className="size-4" />}
          label="Refazer"
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<Heading1 className="size-4" />}
          label="Título 1"
        />
        <ToolbarButton
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 className="size-4" />}
          label="Título 2"
        />
        <ToolbarButton
          pressed={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 className="size-4" />}
          label="Título 3"
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold className="size-4" />}
          label="Negrito"
        />
        <ToolbarButton
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic className="size-4" />}
          label="Itálico"
        />
        <ToolbarButton
          pressed={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<UnderlineIcon className="size-4" />}
          label="Sublinhado"
        />
        <ToolbarButton
          pressed={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          icon={<Strikethrough className="size-4" />}
          label="Riscado"
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List className="size-4" />}
          label="Lista"
        />
        <ToolbarButton
          pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered className="size-4" />}
          label="Num."
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          icon={<AlignLeft className="size-4" />}
          label="Esq."
        />
        <ToolbarButton
          pressed={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          icon={<AlignCenter className="size-4" />}
          label="Centro"
        />
        <ToolbarButton
          pressed={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          icon={<AlignRight className="size-4" />}
          label="Dir."
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={editor.isActive("link")}
          onClick={() => {
            const current = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("URL do link", current || "https://");
            if (url === null) return;
            const trimmed = url.trim();
            if (!trimmed) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: trimmed }).run();
          }}
          icon={<Link2 className="size-4" />}
          label="Link"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={<Minus className="size-4" />}
          label="Linha"
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
  icon,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors",
        pressed
          ? "bg-gym-accent/15 text-gym-accent"
          : "hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}
