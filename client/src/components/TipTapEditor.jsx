import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Extension, Mark } from '@tiptap/core';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, ScanLine, AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import HandwritingScanner from './HandwritingScanner';

// Custom Font Size Mark (Standalone to avoid TextStyle dependency)
const FontSize = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.size) return {};
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="font-size"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setFontSize: size => ({ chain }) => {
        return chain().setMark(this.name, { size }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().unsetMark(this.name).run();
      },
    };
  },
});

export default function TipTapEditor({ content, onChange }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      FontSize,
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
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </MenuButton>
        <div className="w-px h-6 bg-parchment-dark mx-1" />
        
        {/* Font Size Dropdown */}
        <div className="relative flex items-center group">
          <select 
            onChange={(e) => {
              if (e.target.value === 'none') {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(e.target.value).run();
              }
            }}
            className="appearance-none bg-transparent hover:bg-gold/10 text-brown-lighter p-1 px-2 rounded-lg text-sm focus:outline-none cursor-pointer"
            title="Font Size"
            value={editor.getAttributes('fontSize').size || 'none'}
          >
            <option value="none" className="bg-white">Size</option>
            <option value="12px" className="bg-white">12px</option>
            <option value="14px" className="bg-white">14px</option>
            <option value="16px" className="bg-white">16px</option>
            <option value="18px" className="bg-white">18px</option>
            <option value="20px" className="bg-white">20px</option>
            <option value="24px" className="bg-white">24px</option>
            <option value="30px" className="bg-white">30px</option>
            <option value="36px" className="bg-white">36px</option>
          </select>
        </div>
        <div className="w-px h-6 bg-parchment-dark mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Align Justify"
        >
          <AlignJustify size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF9C3' }).run()}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter size={18} />
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
