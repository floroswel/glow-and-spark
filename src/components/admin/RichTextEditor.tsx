import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Eye, EyeOff, Undo, Redo,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent underline" } }),
      Image,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g., when editing a different item)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({ onClick, active, disabled, title, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-secondary transition disabled:opacity-40 ${active ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL link:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL imagine:", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-2 py-1.5">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="h-4 w-4" /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1"><Heading1 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 className="h-4 w-4" /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Listă"><List className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Listă numerotată"><ListOrdered className="h-4 w-4" /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn onClick={setLink} active={editor.isActive("link")} title="Link"><LinkIcon className="h-4 w-4" /></Btn>
        <Btn onClick={addImage} title="Imagine"><ImageIcon className="h-4 w-4" /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo className="h-4 w-4" /></Btn>
        <div className="ml-auto">
          <Btn onClick={() => setShowPreview((s) => !s)} active={showPreview} title="Preview HTML">
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Btn>
        </div>
      </div>

      <EditorContent editor={editor} placeholder={placeholder} />

      {showPreview && (
        <div className="border-t border-border bg-secondary/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Preview HTML</p>
          <div className="prose prose-sm max-w-none rounded-md bg-background p-3 border border-border" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
          <details className="mt-3">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Vezi sursa HTML</summary>
            <pre className="mt-2 text-xs font-mono bg-foreground/5 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">{editor.getHTML()}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
