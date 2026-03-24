import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, ScanLine } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import HandwritingScanner from './HandwritingScanner';

export default function TipTapEditor({ content, onChange }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const MenuButton = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive ? 'bg-gold text-white' : 'text-brown-lighter hover:bg-gold/10 hover:text-gold'
      }`}
    >
      {children}
    </button>
  );

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border border-parchment-dark rounded-xl overflow-hidden bg-white focus-within:border-gold transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-parchment-dark/30 border-b border-parchment-dark">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </MenuButton>
        <div className="w-px h-6 bg-parchment-dark mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={18} />
        </MenuButton>
        <div className="w-px h-6 bg-parchment-dark mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={18} />
        </MenuButton>
        <div className="w-px h-6 bg-parchment-dark mx-1" />
        <MenuButton onClick={addLink} isActive={editor.isActive('link')} title="Link">
          <LinkIcon size={18} />
        </MenuButton>
        <MenuButton onClick={addImage} title="Image">
          <ImageIcon size={18} />
        </MenuButton>
        <div className="w-px h-6 bg-parchment-dark mx-1" />
        <MenuButton onClick={() => setScannerOpen(true)} title="Scan handwriting / photo">
          <ScanLine size={18} />
        </MenuButton>
      </div>

      {/* Content Area */}
      <EditorContent
        editor={editor}
        className="prose-literary min-h-[300px] max-h-[600px] overflow-y-auto px-5 py-4 focus:outline-none"
      />

      {/* Handwriting Scanner Modal */}
      <AnimatePresence>
        {scannerOpen && (
          <HandwritingScanner
            onInsert={(html) => {
              editor.chain().focus().insertContent(html).run();
              onChange(editor.getHTML());
            }}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
