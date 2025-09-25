import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Highlighter,
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Save,
  History,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/use-socket';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  collaborativeId?: string; // For collaborative editing
  className?: string;
  showVersionHistory?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface EditorVersion {
  id: string;
  content: string;
  timestamp: Date;
  user: string;
  changes: string;
}

export function RichTextEditor({
  content = '',
  onChange,
  onSave,
  placeholder = 'Start typing...',
  editable = true,
  collaborativeId,
  className,
  showVersionHistory = true,
  autoSave = true,
  autoSaveDelay = 2000
}: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [versions, setVersions] = useState<EditorVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  
  const { socket, isConnected } = useSocket();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
      setIsEditing(true);
      
      // Collaborative editing - emit changes
      if (collaborativeId && socket && isConnected) {
        socket.emit('editor-change', {
          collaborativeId,
          content: html,
          userId: 'current-user' // TODO: Get from auth context
        });
      }
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isEditing || !editor) return;

    const timer = setTimeout(() => {
      handleSave();
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [editor?.getHTML(), autoSave, autoSaveDelay, isEditing]);

  // Collaborative editing setup
  useEffect(() => {
    if (!collaborativeId || !socket || !isConnected) return;

    // Join collaboration room
    socket.emit('join-editor', { collaborativeId });

    // Listen for changes from other users
    socket.on('editor-change', (data: { content: string; userId: string }) => {
      if (data.userId !== 'current-user' && editor) {
        // Update content without triggering onChange
        editor.commands.setContent(data.content, false);
      }
    });

    // Listen for collaborator updates
    socket.on('collaborator-joined', (data: { userId: string }) => {
      setCollaborators(prev => [...prev.filter(id => id !== data.userId), data.userId]);
    });

    socket.on('collaborator-left', (data: { userId: string }) => {
      setCollaborators(prev => prev.filter(id => id !== data.userId));
    });

    return () => {
      socket.off('editor-change');
      socket.off('collaborator-joined');
      socket.off('collaborator-left');
      socket.emit('leave-editor', { collaborativeId });
    };
  }, [collaborativeId, socket, isConnected, editor]);

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;
    
    setIsSaving(true);
    try {
      const currentContent = editor.getHTML();
      
      // Create version history entry
      if (showVersionHistory) {
        const newVersion: EditorVersion = {
          id: Date.now().toString(),
          content: currentContent,
          timestamp: new Date(),
          user: 'Current User', // TODO: Get from auth context
          changes: 'Content updated'
        };
        setVersions(prev => [newVersion, ...prev.slice(0, 19)]); // Keep last 20 versions
      }
      
      await onSave(currentContent);
      setLastSaved(new Date());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave, showVersionHistory]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter the URL');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const restoreVersion = useCallback((version: EditorVersion) => {
    if (editor) {
      editor.commands.setContent(version.content);
      setShowVersions(false);
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded-md p-4 min-h-[200px] flex items-center justify-center text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="border-b p-2 flex flex-wrap items-center gap-1">
          {/* Basic formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && 'bg-muted')}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && 'bg-muted')}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(editor.isActive('strike') && 'bg-muted')}
            data-testid="button-strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn(editor.isActive('highlight') && 'bg-muted')}
            data-testid="button-highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-muted')}
            data-testid="button-bullet-list"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && 'bg-muted')}
            data-testid="button-ordered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive('blockquote') && 'bg-muted')}
            data-testid="button-blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
            data-testid="button-align-left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
            data-testid="button-align-center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
            data-testid="button-align-right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Links */}
          <Button
            variant="ghost"
            size="sm"
            onClick={addLink}
            className={cn(editor.isActive('link') && 'bg-muted')}
            data-testid="button-link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            data-testid="button-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            data-testid="button-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Collaborators indicator */}
            {collaborativeId && collaborators.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{collaborators.length}</span>
              </div>
            )}

            {/* Version history */}
            {showVersionHistory && versions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersions(!showVersions)}
                data-testid="button-version-history"
              >
                <History className="h-4 w-4" />
              </Button>
            )}

            {/* Save status */}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}

            {/* Manual save button */}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !isEditing}
                data-testid="button-save"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px]"
        />
        
        {/* Connection status for collaborative editing */}
        {collaborativeId && (
          <div className="absolute top-2 right-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
        )}
      </div>

      {/* Version History Panel */}
      {showVersions && (
        <div className="border-t p-4 max-h-60 overflow-y-auto">
          <h4 className="font-medium mb-2">Version History</h4>
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-2 border rounded">
                <div className="text-sm">
                  <div className="font-medium">{version.user}</div>
                  <div className="text-muted-foreground">{version.timestamp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{version.changes}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreVersion(version)}
                  data-testid={`button-restore-version-${version.id}`}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}