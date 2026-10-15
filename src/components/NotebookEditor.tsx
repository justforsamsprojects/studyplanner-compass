import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  onSave: (html: string) => void;
}

/** Editor rico com salvamento automático (debounce). */
export function NotebookEditor({ content, onSave }: Props) {
  const [status, setStatus] = useState<"salvo" | "salvando">("salvo");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "notebook-prose min-h-[420px] rounded-b-xl border border-t-0 border-border bg-card p-5 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      setStatus("salvando");
      if (timer.current) clearTimeout(timer.current);
      const html = editor.getHTML();
      timer.current = setTimeout(() => {
        saveRef.current(html);
        setStatus("salvo");
      }, 500);
    },
  });

  // salva pendências ao trocar de documento / sair
  useEffect(() => {
    return () => {
      if (timer.current && editor) {
        clearTimeout(timer.current);
        saveRef.current(editor.getHTML());
      }
    };
  }, [editor]);

  if (!editor) return <div className="min-h-[460px] rounded-xl border border-border bg-card" />;

  const btn = (active: boolean, onClick: () => void, label: string, Icon: typeof Bold) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        active && "bg-brand-soft text-primary",
      )}
    >
      <Icon className="size-4" />
    </button>
  );

  const setLink = () => {
    const prev = editor.getAttributes("link")["href"] as string | undefined;
    const url = window.prompt("URL do link (deixe vazio para remover)", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL da imagem", "https://");
    if (url && /^https?:\/\//.test(url.trim())) {
      editor.chain().focus().setImage({ src: url.trim() }).run();
    }
  };

  const c = () => editor.chain().focus();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-border bg-secondary/50 p-1.5">
        {btn(editor.isActive("heading", { level: 1 }), () => c().toggleHeading({ level: 1 }).run(), "Título 1", Heading1)}
        {btn(editor.isActive("heading", { level: 2 }), () => c().toggleHeading({ level: 2 }).run(), "Título 2", Heading2)}
        {btn(editor.isActive("heading", { level: 3 }), () => c().toggleHeading({ level: 3 }).run(), "Título 3", Heading3)}
        {btn(editor.isActive("paragraph"), () => c().setParagraph().run(), "Parágrafo", Pilcrow)}
        <span className="mx-1 h-5 w-px bg-border" />
        {btn(editor.isActive("bold"), () => c().toggleBold().run(), "Negrito", Bold)}
        {btn(editor.isActive("italic"), () => c().toggleItalic().run(), "Itálico", Italic)}
        <span className="mx-1 h-5 w-px bg-border" />
        {btn(editor.isActive("bulletList"), () => c().toggleBulletList().run(), "Lista", List)}
        {btn(editor.isActive("orderedList"), () => c().toggleOrderedList().run(), "Lista numerada", ListOrdered)}
        <span className="mx-1 h-5 w-px bg-border" />
        {btn(editor.isActive("link"), setLink, "Link", Link2)}
        {btn(false, addImage, "Imagem por URL", ImageIcon)}
        <span className="ml-auto pr-2 text-xs font-medium text-muted-foreground">
          {status === "salvo" ? "✓ Salvo" : "Salvando…"}
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
