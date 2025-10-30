/**
 * Rich Text Editor Widget for DynamicForm
 * 
 * Uses TipTap for rich text editing with configurable toolbar
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Strikethrough, Code, Heading2, List, ListOrdered,
  Quote, Undo, Redo, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WidgetProps } from './WidgetRegistry';
import { useEffect } from 'react';

export function RichTextWidget({ field, value, onChange, error, disabled, language }: WidgetProps) {
  const config = field.richTextConfig || {};
  const toolbar = config.toolbar || {};

  // Get localized placeholder
  const getPlaceholder = (): string => {
    if (language === 'fa' && config.placeholderFa) return config.placeholderFa;
    if (language === 'ar' && config.placeholderAr) return config.placeholderAr;
    return config.placeholderEn || config.placeholder || 'Start typing...';
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: toolbar.heading !== false ? { levels: [1, 2, 3] } : false,
        bulletList: toolbar.bulletList !== false,
        orderedList: toolbar.orderedList !== false,
        blockquote: toolbar.blockquote !== false,
        code: toolbar.code !== false,
        codeBlock: toolbar.codeBlock !== false,
      }),
      Placeholder.configure({
        placeholder: getPlaceholder(),
      }),
      ...(toolbar.textAlign !== false ? [TextAlign.configure({ types: ['heading', 'paragraph'] })] : []),
      ...(toolbar.highlight !== false ? [Highlight] : []),
      ...(toolbar.link !== false ? [Link.configure({ openOnClick: false })] : []),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const ToolbarButton = ({ 
    onClick, 
    active, 
    disabled, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    disabled?: boolean; 
    icon: any; 
    title: string;
  }) => (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  return (
    <div className="space-y-2" data-testid={`richtext-${field.id}`}>
      {/* Toolbar */}
      <div className="border rounded-t-lg p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-900">
        {toolbar.bold !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            icon={Bold}
            title="Bold"
          />
        )}
        {toolbar.italic !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            icon={Italic}
            title="Italic"
          />
        )}
        {toolbar.strikethrough !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            icon={Strikethrough}
            title="Strikethrough"
          />
        )}
        {toolbar.code !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            icon={Code}
            title="Code"
          />
        )}
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-1" />
        
        {toolbar.heading !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            icon={Heading2}
            title="Heading"
          />
        )}
        {toolbar.bulletList !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            icon={List}
            title="Bullet List"
          />
        )}
        {toolbar.orderedList !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            icon={ListOrdered}
            title="Numbered List"
          />
        )}
        {toolbar.blockquote !== false && (
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            icon={Quote}
            title="Quote"
          />
        )}
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon={Undo}
          title="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon={Redo}
          title="Redo"
        />
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={cn(
          "border border-t-0 rounded-b-lg p-4 min-h-[200px] prose dark:prose-invert max-w-none",
          "focus-within:ring-2 focus-within:ring-primary",
          error && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ height: config.height ? `${config.height}px` : 'auto' }}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Character count */}
      {(config.minLength || config.maxLength) && (
        <p className="text-xs text-gray-500 text-right">
          {editor.getText().length}
          {config.maxLength && ` / ${config.maxLength}`} characters
        </p>
      )}
    </div>
  );
}
