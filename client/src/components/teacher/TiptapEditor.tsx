import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

interface Props {
  editor: Editor;
  wordCount: number;
}

export function TiptapEditor({ editor, wordCount }: Props) {
  if (!editor) return null;
  const tools: Array<{ label: string; action: () => boolean; active: boolean; testId: string }> = [
    { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), testId: "button-bold" },
    { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), testId: "button-italic" },
    { label: "S", action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), testId: "button-strike" },
    { label: "H1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), testId: "button-h1" },
    { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), testId: "button-h2" },
    { label: "H3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }), testId: "button-h3" },
    { label: "• List", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), testId: "button-bullet-list" },
    { label: "1. List", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), testId: "button-ordered-list" },
    { label: "Highlight", action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive("highlight"), testId: "button-highlight" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Rich Text Instructions</span>
        <Badge variant="secondary" className="text-xs">{wordCount} {wordCount === 1 ? "word" : "words"}</Badge>
      </div>
      <div className="border rounded-lg">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
          {tools.map(({ label, action, active, testId }) => (
            <Button key={testId} type="button" size="sm" variant={active ? "default" : "ghost"} onClick={action} data-testid={testId} title={label}>
              {label === "B" ? <strong>B</strong> : label === "I" ? <em>I</em> : label === "S" ? <s>S</s> : label}
            </Button>
          ))}
        </div>
        <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[200px] focus:outline-none" dir="ltr" style={{ direction: "ltr", textAlign: "left" }} />
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>Use the rich text editor to create detailed writing instructions</span>
        <span className="text-blue-600 font-medium">{wordCount} words</span>
      </div>
    </div>
  );
}
