import React, { useRef, useEffect, useState, DragEvent, useMemo } from 'react';
import { User } from '../types';
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, EraserIcon, CheckboxIcon } from './Icons';

interface RichTextEditorProps {
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    onFilesDrop?: (files: File[]) => void;
    users: User[];
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, onFilesDrop, users }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [mentionPopup, setMentionPopup] = useState<{ top: number; left: number; query: string; } | null>(null);

    useEffect(() => {
        const editor = editorRef.current;
        if (editor && value !== editor.innerHTML) {
            editor.innerHTML = value;
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const editor = editorRef.current;
        if (!editor) return;

        const newHtml = e.currentTarget.innerHTML;
        onChange(newHtml);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
                const text = node.textContent || '';
                const atIndex = text.lastIndexOf('@', range.startOffset - 1);

                if (atIndex !== -1 && (atIndex === 0 || /\s|&nbsp;/.test(text.substring(atIndex - 1, atIndex)))) {
                    const query = text.substring(atIndex + 1, range.startOffset);
                    
                    const tempRange = document.createRange();
                    tempRange.setStart(node, atIndex);
                    tempRange.setEnd(node, atIndex + 1);
                    
                    const mentionRect = tempRange.getBoundingClientRect();
                    const editorRect = editor.getBoundingClientRect();
                    
                    setMentionPopup({
                        top: mentionRect.bottom - editorRect.top,
                        left: mentionRect.left - editorRect.left,
                        query,
                    });
                    return;
                }
            }
        }
        setMentionPopup(null);
    };
    
    const handleSelectMention = (user: User) => {
        const editor = editorRef.current;
        if (!editor || !mentionPopup) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        
        if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent || '';
            const cursorPosition = range.startOffset;
            const textBeforeCursor = textContent.slice(0, cursorPosition);
            const atIndex = textBeforeCursor.lastIndexOf('@');

            if (atIndex !== -1) {
                // We found the trigger '@'. Now replace from there to the cursor.
                range.setStart(node, atIndex);
                range.setEnd(node, cursorPosition);

                const mentionNode = document.createElement('span');
                mentionNode.className = 'mention';
                mentionNode.setAttribute('data-mention', 'true');
                mentionNode.setAttribute('data-user-id', user.id);
                mentionNode.setAttribute('contenteditable', 'false');
                mentionNode.textContent = `@${user.name}`;

                range.deleteContents();
                range.insertNode(mentionNode);

                // Move cursor after the inserted mention
                const spaceNode = document.createTextNode('\u00A0'); // Non-breaking space
                range.setStartAfter(mentionNode);
                range.setEndAfter(mentionNode);
                range.insertNode(spaceNode);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);

                setMentionPopup(null);
                onChange(editor.innerHTML);
                editor.focus();
            }
        }
    };

    const filteredUsers = useMemo(() => {
        if (!mentionPopup) return [];
        const query = mentionPopup.query.toLowerCase();
        return users.filter(user => user.name.toLowerCase().includes(query));
    }, [mentionPopup, users]);

    const handleCommand = (command: string, value?: string) => {
        if (command === 'insertCheckbox') {
             document.execCommand('insertHTML', false, `
                <div class="task-item">
                    <input type="checkbox" contenteditable="false" onclick="this.nextElementSibling.setAttribute('data-checked', this.checked.toString())" />
                    <span class="task-item-text" data-checked="false">&nbsp;</span>
                </div>
            `);
        } else {
            document.execCommand(command, false, value);
        }
        
        const editor = editorRef.current;
        if (editor) {
            editor.focus();
            onChange(editor.innerHTML);
        }
    };

    const handleDragEvent = (e: DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(isEntering);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDragEvent(e, false);
        const editor = editorRef.current;
        if (!editor) return;

        // Handle Links
        try {
            const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
            if (url && (new URL(url).protocol === 'http:' || new URL(url).protocol === 'https:')) {
                handleCommand('createLink', url);
                return;
            }
        } catch (_) { /* Not a valid URL, proceed to file handling */ }

        // Handle Files
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const allFiles = Array.from(e.dataTransfer.files);
            if (onFilesDrop) {
                onFilesDrop(allFiles);
            }
        }
    };
    
    const ToolbarButton = ({ command, children }: { command: string, children: React.ReactNode}) => (
        <button
            type="button"
            onMouseDown={e => {
                e.preventDefault();
                handleCommand(command);
            }}
            className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
            aria-label={command}
        >
            {children}
        </button>
    )

    return (
        <div className="relative">
            <div className={`bg-white border border-slate-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow ${isDraggingOver ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                <div className="flex items-center gap-1 p-1 border-b border-slate-200">
                    <ToolbarButton command="bold">
                        <BoldIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton command="italic">
                        <ItalicIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton command="insertUnorderedList">
                        <ListIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <ToolbarButton command="insertOrderedList">
                        <ListOrderedIcon className="w-5 h-5" />
                    </ToolbarButton>
                     <ToolbarButton command="insertCheckbox">
                        <CheckboxIcon className="w-5 h-5" />
                    </ToolbarButton>
                    <div className="border-l h-5 mx-1 border-slate-200"></div>
                    <ToolbarButton command="removeFormat">
                        <EraserIcon className="w-5 h-5" />
                    </ToolbarButton>
                </div>
                <div
                    ref={editorRef}
                    onInput={handleInput}
                    onDragEnter={(e) => handleDragEvent(e, true)}
                    onDragLeave={(e) => handleDragEvent(e, false)}
                    onDragOver={(e) => handleDragEvent(e, true)}
                    onDrop={handleDrop}
                    contentEditable={true}
                    data-placeholder={placeholder}
                    className="prose max-w-none prose-sm p-3 min-h-[80px] focus:outline-none"
                />
            </div>
            {mentionPopup && filteredUsers.length > 0 && (
                <div
                    style={{ top: mentionPopup.top, left: mentionPopup.left }}
                    className="absolute z-20 mt-1 bg-white shadow-lg rounded-md border w-48 max-h-40 overflow-y-auto"
                >
                    {filteredUsers.map(user => (
                        <button
                            key={user.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSelectMention(user)}
                            className="w-full text-left p-2 text-sm hover:bg-slate-100"
                        >
                            {user.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;