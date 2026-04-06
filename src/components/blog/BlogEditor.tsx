'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

interface BlogEditorProps {
  onContentChange?: (content: string, plainText: string) => void;
  initialContent?: string;
}

export default function BlogEditor({ onContentChange, initialContent = '' }: BlogEditorProps) {
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm mx-auto focus:outline-none min-h-96 p-4 border rounded-lg text-gray-700',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plainText = editor.getText();
      setCharCount(plainText.length);
      onContentChange?.(html, plainText);
    },
  });

  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleCode = () => editor.chain().focus().toggleCodeBlock().run();
  const toggleUL = () => editor.chain().focus().toggleBulletList().run();
  const toggleOL = () => editor.chain().focus().toggleOrderedList().run();

  const addHeading1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const addHeading2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const addHeading3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const isActive = (format: string) => {
    if (format === 'bold') return editor.isActive('bold');
    if (format === 'italic') return editor.isActive('italic');
    if (format === 'code') return editor.isActive('codeBlock');
    if (format === 'ul') return editor.isActive('bulletList');
    if (format === 'ol') return editor.isActive('orderedList');
    if (format === 'h1') return editor.isActive('heading', { level: 1 });
    if (format === 'h2') return editor.isActive('heading', { level: 2 });
    if (format === 'h3') return editor.isActive('heading', { level: 3 });
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg border border-gray-300">
        {/* Text Formatting */}
        <button
          onClick={toggleBold}
          className={`px-4 py-2 rounded font-semibold transition-colors ${
            isActive('bold')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        <button
          onClick={toggleItalic}
          className={`px-4 py-2 rounded italic transition-colors ${
            isActive('italic')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        {/* Divider */}
        <div className="border-r border-gray-300"></div>

        {/* Headings */}
        <button
          onClick={addHeading1}
          className={`px-4 py-2 rounded transition-colors text-lg font-bold ${
            isActive('h1')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Heading 1"
        >
          H1
        </button>

        <button
          onClick={addHeading2}
          className={`px-4 py-2 rounded transition-colors text-base font-bold ${
            isActive('h2')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          onClick={addHeading3}
          className={`px-4 py-2 rounded transition-colors text-sm font-bold ${
            isActive('h3')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Heading 3"
        >
          H3
        </button>

        {/* Divider */}
        <div className="border-r border-gray-300"></div>

        {/* Lists */}
        <button
          onClick={toggleUL}
          className={`px-4 py-2 rounded transition-colors ${
            isActive('ul')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Bullet List"
        >
          •••
        </button>

        <button
          onClick={toggleOL}
          className={`px-4 py-2 rounded transition-colors ${
            isActive('ol')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Numbered List"
        >
          1.
        </button>

        {/* Divider */}
        <div className="border-r border-gray-300"></div>

        {/* Links */}
        <button
          onClick={addLink}
          className="px-4 py-2 rounded bg-white text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
          title="Add Link"
        >
          🔗
        </button>

        <button
          onClick={toggleCode}
          className={`px-4 py-2 rounded font-mono transition-colors ${
            isActive('code')
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          title="Code Block"
        >
          {'<>'}
        </button>
      </div>

      <EditorContent editor={editor} />

      <div className="text-sm text-gray-500">
        Character count: {charCount}
      </div>
    </div>
  );
}
