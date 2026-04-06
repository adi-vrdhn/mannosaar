/* eslint-disable-next-line react/no-danger-with-children */
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Highlighter,
  Palette,
  Type,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your article...',
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-96 p-4 bg-white rounded-lg border border-gray-200',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-2 md:grid-cols-6 lg:grid-cols-10">
        {/* Text Style Buttons */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Underline"
        >
          <Underline size={18} />
        </button>

        <div className="border-l border-gray-200"></div>

        {/* Heading Buttons */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>

        <div className="border-l border-gray-200"></div>

        {/* List Buttons */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Bullet List"
        >
          <List size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="border-l border-gray-200"></div>

        {/* Color Picker Button */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Text Color"
          >
            <Palette size={18} />
          </button>
          {showColorPicker && (
            <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg p-3 z-10 grid grid-cols-6 gap-2">
              {[
                { color: '#000000', name: 'Black' },
                { color: '#e60000', name: 'Red' },
                { color: '#ff9900', name: 'Orange' },
                { color: '#ffff00', name: 'Yellow' },
                { color: '#008000', name: 'Green' },
                { color: '#0066cc', name: 'Blue' },
                { color: '#9933ff', name: 'Purple' },
                { color: '#ffffff', name: 'White' },
              ].map(({ color, name }) => {
                // eslint-disable-next-line @next/next/no-css-tags
                return (
                  <div
                    key={color}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    title={name}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Highlight Button */}
        <div className="relative">
          <button
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Highlight Color"
          >
            <Highlighter size={18} />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg p-3 z-10 grid grid-cols-4 gap-2">
              {[
                { color: '#ffff00', name: 'Yellow' },
                { color: '#00ff00', name: 'Green' },
                { color: '#ffcccc', name: 'Red' },
                { color: '#ccccff', name: 'Blue' },
              ].map(({ color, name }) => {
                // eslint-disable-next-line @next/next/no-css-tags
                return (
                  <div
                    key={color}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 cursor-pointer"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightPicker(false);
                    }}
                    title={name}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
