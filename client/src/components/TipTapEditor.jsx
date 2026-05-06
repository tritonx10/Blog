import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Mark } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, 
  Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, ScanLine, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter, 
  Trash2, MoveLeft, MoveRight, Maximize, Minimize, Smartphone, Type, ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import HandwritingScanner from './HandwritingScanner';

// ── Magazine Layout Image Component ──────────────────────────
const LiteraryImageComponent = ({ node, selected, editor, getPos }) => {
  const size = node.attrs.size || 'large';
  const align = node.attrs.align || 'center';
  
  const handleSelect = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.commands.setNodeSelection(pos);
    }
  };

  const containerStyle = {
    display: 'block',
    width: '100%',
    clear: align === 'center' ? 'both' : 'none',
    textAlign: align,
  };

  const imgStyle = {
    width: size === 'small' ? '35%' : (size === 'medium' ? '65%' : '100%'),
    height: 'auto',
    borderRadius: '16px',
    float: align === 'center' ? 'none' : align,
    margin: align === 'left' ? '0.5rem 2rem 1.5rem 0' : (align === 'right' ? '0.5rem 0 1.5rem 2rem' : '2rem auto'),
    outline: selected ? '4px solid #C9A84C' : 'none',
    outlineOffset: '4px',
    transition: 'all 0.3s ease',
    boxShadow: selected ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer'
  };

  return (
    <NodeViewWrapper style={containerStyle} className="literary-image-wrapper" onClick={handleSelect}>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt}
        style={imgStyle}
        className="literary-image"
        onClick={handleSelect}
        onMouseDown={handleSelect}
      />
    </NodeViewWrapper>
  );
};

const CustomImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      size: { 
        default: 'large',
        parseHTML: element => element.getAttribute('data-size') || 'large',
      },
      align: { 
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { size, align, ...rest } = HTMLAttributes;
    const styles = [
      `width: ${size === 'small' ? '35%' : (size === 'medium' ? '65%' : '100%')}`,
      'height: auto',
      'border-radius: 12px',
      'display: block'
    ];
    if (align !== 'center') {
      styles.push(`float: ${align}`);
      styles.push(align === 'left' ? 'margin: 0.5rem 2rem 1.5rem 0' : 'margin: 0.5rem 0 1.5rem 2rem');
    } else {
      styles.push('margin: 2rem auto');
    }
    return ['img', { ...rest, style: styles.join('; ') + ';', 'data-size': size, 'data-align': align }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(LiteraryImageComponent);
  },
});

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
  parseHTML() { return [{ tag: 'span[style*="font-size"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['span', HTMLAttributes, 0]; },
  addCommands() {
    return {
      setFontSize: size => ({ chain }) => chain().setMark(this.name, { size }).run(),
      unsetFontSize: () => ({ chain }) => chain().unsetMark(this.name).run(),
    };
  },
});

export default function TipTapEditor({ content, onChange }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [activeNodeType, setActiveNodeType] = useState('text');
  const sizeMenuRef = useRef(null);

  const updateSelectionState = (editorInstance) => {
    const isImage = editorInstance.isActive('image') || 
                   (editorInstance.state.selection instanceof NodeSelection && 
                    editorInstance.state.selection.node.type.name === 'image');
    setActiveNodeType(isImage ? 'image' : 'text');
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: { class: 'text-sage-dark underline decoration-sage/30 hover:text-gold transition-colors' }
      }),
      CustomImage,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      FontSize,
    ],
    content: content || '',
    editorProps: {
      attributes: { class: 'min-h-[500px] focus:outline-none cursor-text prose-literary' },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (!file) return false;
          const reader = new FileReader();
          reader.onload = (e) => {
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src: e.target.result, size: 'large', align: 'center' });
            const transaction = view.state.tr.replaceSelectionWith(node);
            view.dispatch(transaction);
          };
          reader.readAsDataURL(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: ({ editor }) => updateSelectionState(editor),
    onTransaction: ({ editor }) => updateSelectionState(editor),
  });

  useEffect(() => {
    if (editor && isInitialLoad && content) {
      editor.commands.setContent(content, false);
      setIsInitialLoad(false);
    }
  }, [content, editor, isInitialLoad]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target)) setShowSizeMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const MenuButton = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-gold text-white shadow-sm' : 'text-brown-lighter hover:bg-gold/10 hover:text-gold'}`}
      title={title}
    >
      {children}
    </button>
  );

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const setFontSize = (size) => {
    editor.chain().focus().setFontSize(size).run();
    setShowSizeMenu(false);
  };

  // ── Critical: Robust Selection Detection ────────────────────
  const isImageSelected = activeNodeType === 'image';
  
  const currentFontSize = editor.getAttributes('fontSize').size || '18px';

  const deleteImage = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    // Do NOT call .focus() here. Focusing the editor body clears the NodeSelection 
    // of the custom React component before the delete command can run.
    editor.commands.deleteSelection();
  };

  return (
    <div className="border border-parchment-dark rounded-xl overflow-hidden bg-white focus-within:border-gold transition-colors shadow-lg">
      <div className="flex flex-wrap items-center gap-1 p-1 bg-parchment-dark/30 border-b border-parchment-dark min-h-[52px]">
        {!isImageSelected ? (
          <div className="flex items-center gap-1 flex-wrap animate-in fade-in duration-300">
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={18} /></MenuButton>
            <div className="w-px h-6 bg-parchment-dark mx-1" />
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#E0F2FE' }).run()} isActive={editor.isActive('highlight')} title="Highlighter"><Highlighter size={18} /></MenuButton>
            
            <div className="relative" ref={sizeMenuRef}>
              <button
                type="button"
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-brown-lighter hover:bg-gold/10 hover:text-gold transition-colors text-xs font-sans font-bold`}
              >
                <Type size={16} />
                <span>{currentFontSize.replace('px', '')}</span>
                <ChevronDown size={12} />
              </button>
              {showSizeMenu && (
                <div className="absolute top-full left-0 mt-1 w-20 bg-white border border-parchment-dark rounded-lg shadow-xl z-50 flex flex-col p-1">
                  {[12, 14, 16, 18, 20, 24, 30, 36].map((size) => (
                    <button key={size} type="button" onClick={() => setFontSize(`${size}px`)} className="px-3 py-1.5 text-left text-sm hover:bg-gold/10 hover:text-gold rounded-md font-sans transition-colors">{size}</button>
                  ))}
                  <button type="button" onClick={() => editor.chain().focus().unsetFontSize().run()} className="px-3 py-1.5 text-left text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 rounded-md border-t border-parchment-dark mt-1">Reset</button>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-parchment-dark mx-1" />
            <MenuButton onClick={addLink} isActive={editor.isActive('link')} title="Link"><LinkIcon size={18} /></MenuButton>
            <div className="w-px h-6 bg-parchment-dark mx-1" />
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Left"><AlignLeft size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Right"><AlignRight size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={18} /></MenuButton>
            <div className="w-px h-6 bg-parchment-dark mx-1" />
            <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullets"><List size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbers"><ListOrdered size={18} /></MenuButton>
            <div className="w-px h-6 bg-parchment-dark mx-1" />
            <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote"><Quote size={18} /></MenuButton>
            <MenuButton onClick={() => setScannerOpen(true)} title="Scan"><ScanLine size={18} /></MenuButton>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-1 bg-gold/10 rounded-lg w-full overflow-x-auto animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-1 px-2 border-r border-gold/20">
              <span className="text-[10px] uppercase font-bold text-gold-dark mr-2">Size:</span>
              <MenuButton onClick={() => editor.chain().focus().updateAttributes('image', { size: 'small' }).run()} isActive={editor.getAttributes('image').size === 'small'} title="Small"><Minimize size={16} /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().updateAttributes('image', { size: 'medium' }).run()} isActive={editor.getAttributes('image').size === 'medium'} title="Medium"><Smartphone size={16} /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().updateAttributes('image', { size: 'large' }).run()} isActive={editor.getAttributes('image').size === 'large'} title="Large"><Maximize size={16} /></MenuButton>
            </div>
            <div className="flex items-center gap-1 px-2 border-r border-gold/20">
              <span className="text-[10px] uppercase font-bold text-gold-dark mr-2">Pos:</span>
              <MenuButton onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()} isActive={editor.getAttributes('image').align === 'left'} title="Float Left"><MoveLeft size={16} /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()} isActive={editor.getAttributes('image').align === 'center'} title="Center"><AlignJustify size={16} /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()} isActive={editor.getAttributes('image').align === 'right'} title="Float Right"><MoveRight size={16} /></MenuButton>
            </div>
            <div className="flex-1" />
            <button onMouseDown={deleteImage} className="text-red-500 hover:bg-red-500/15 p-2 rounded-lg transition-colors ml-auto bg-white/50 shadow-sm" title="Delete Image">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="max-h-[650px] overflow-y-auto px-5 py-4 cursor-text bg-white/50" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} className="prose-literary focus:outline-none" />
      </div>
      <AnimatePresence>
        {scannerOpen && (
          <HandwritingScanner
            onInsert={(html) => { editor.chain().focus().insertContent(html).run(); onChange(editor.getHTML()); }}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
