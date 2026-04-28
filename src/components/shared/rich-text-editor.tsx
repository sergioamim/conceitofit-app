"use client";

import { type ReactNode, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");

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
  const activeEditor = editor;

  function openLinkDialog() {
    const current = activeEditor.getAttributes("link").href as string | undefined;
    setLinkUrl(current || "https://");
    setLinkDialogOpen(true);
  }

  function applyLink() {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      activeEditor.chain().focus().unsetLink().run();
    } else {
      activeEditor.chain().focus().setLink({ href: trimmed }).run();
    }
    setLinkDialogOpen(false);
  }

  return (
    <>
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar link</DialogTitle>
            <DialogDescription>
              Informe a URL completa. Deixe vazio para remover o link selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="rich-text-editor-link-url"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              URL
            </label>
            <Input
              id="rich-text-editor-link-url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyLink}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          onClick={() => activeEditor.chain().focus().undo().run()}
          icon={<Undo2 className="size-4" />}
          label="Desfazer"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => activeEditor.chain().focus().redo().run()}
          icon={<Redo2 className="size-4" />}
          label="Refazer"
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={activeEditor.isActive("heading", { level: 1 })}
          onClick={() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<Heading1 className="size-4" />}
          label="Título 1"
        />
        <ToolbarButton
          pressed={activeEditor.isActive("heading", { level: 2 })}
          onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 className="size-4" />}
          label="Título 2"
        />
        <ToolbarButton
          pressed={activeEditor.isActive("heading", { level: 3 })}
          onClick={() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 className="size-4" />}
          label="Título 3"
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={activeEditor.isActive("bold")}
          onClick={() => activeEditor.chain().focus().toggleBold().run()}
          icon={<Bold className="size-4" />}
          label="Negrito"
        />
        <ToolbarButton
          pressed={activeEditor.isActive("italic")}
          onClick={() => activeEditor.chain().focus().toggleItalic().run()}
          icon={<Italic className="size-4" />}
          label="Itálico"
        />
        <ToolbarButton
          pressed={activeEditor.isActive("underline")}
          onClick={() => activeEditor.chain().focus().toggleUnderline().run()}
          icon={<UnderlineIcon className="size-4" />}
          label="Sublinhado"
        />
        <ToolbarButton
          pressed={activeEditor.isActive("strike")}
          onClick={() => activeEditor.chain().focus().toggleStrike().run()}
          icon={<Strikethrough className="size-4" />}
          label="Riscado"
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={activeEditor.isActive("bulletList")}
          onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
          icon={<List className="size-4" />}
          label="Lista"
        />
        <ToolbarButton
          pressed={activeEditor.isActive("orderedList")}
          onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered className="size-4" />}
          label="Num."
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={activeEditor.isActive({ textAlign: "left" })}
          onClick={() => activeEditor.chain().focus().setTextAlign("left").run()}
          icon={<AlignLeft className="size-4" />}
          label="Esq."
        />
        <ToolbarButton
          pressed={activeEditor.isActive({ textAlign: "center" })}
          onClick={() => activeEditor.chain().focus().setTextAlign("center").run()}
          icon={<AlignCenter className="size-4" />}
          label="Centro"
        />
        <ToolbarButton
          pressed={activeEditor.isActive({ textAlign: "right" })}
          onClick={() => activeEditor.chain().focus().setTextAlign("right").run()}
          icon={<AlignRight className="size-4" />}
          label="Dir."
        />
        <ToolbarDivider />
        <ToolbarButton
          pressed={activeEditor.isActive("link")}
          onClick={openLinkDialog}
          icon={<Link2 className="size-4" />}
          label="Link"
        />
        <ToolbarButton
          pressed={false}
          onClick={() => activeEditor.chain().focus().setHorizontalRule().run()}
          icon={<Minus className="size-4" />}
          label="Linha"
        />
        </div>
        <EditorContent editor={activeEditor} />
      </div>
    </>
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
