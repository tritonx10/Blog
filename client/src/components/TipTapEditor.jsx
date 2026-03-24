import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { 
  Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, 
  Heading1, Heading2, ScanLine, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, Type, Highlighter
} from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import HandwritingScanner from './HandwritingScanner';

// Custom Font Size extension
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
      },
    };
  },
});

export default function TipTapEditor({ content, onChange }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
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
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </MenuButton>
        
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

        <div className="w-px h-6 bg-parchment-dark mx-1" />
        
        <div className="flex items-center gap-1 px-1">
          <input
            type="color"
            onInput={e => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#3B2A1A'}
            className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
            title="Text Color"
          />
          <button
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run()}
            className={`p-2 rounded-lg transition-colors ${editor.isActive('highlight') ? 'bg-gold text-white' : 'text-brown-lighter hover:bg-gold/10'}`}
            title="Highlight"
          >
            <Highlighter size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-parchment-dark mx-1" />

        <select
          onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}
          className="bg-transparent text-sm text-brown-lighter border-none focus:ring-0 cursor-pointer p-1"
          value={editor.getAttributes('textStyle').fontSize || '18px'}
        >
          <option value="14px">Small</option>
          <option value="18px">Normal</option>
          <option value="24px">Large</option>
          <option value="32px">X-Large</option>
        </select>

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
