import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { UploadIcon, TrashIcon } from './icons';

interface FileInputProps {
  id: string;
  label: string;
  optionalText?: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  rows: number;
  isLoading: boolean;
  accept?: string;
}

const FileInput: React.FC<FileInputProps> = ({ id, label, optionalText, value, setValue, placeholder, rows, isLoading, accept }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const processFile = async (file: File | null) => {
        if (!file || isLoading) return;

        setFileName(file.name);
        setValue(`Processing "${file.name}"...`); // Provide immediate feedback

        if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
            try {
                const zip = await JSZip.loadAsync(file);
                let content = `--- ZIP FILE: ${file.name} ---\n\n`;
                const filePromises: Promise<string>[] = [];

                zip.forEach((_, zipEntry) => {
                    if (!zipEntry.dir) {
                        filePromises.push(
                            zipEntry.async('string').then(text => (
                                `// --- FILE: ${zipEntry.name} ---\n${text}\n// --- END FILE: ${zipEntry.name} ---\n\n`
                            ))
                        );
                    }
                });

                const results = await Promise.all(filePromises);
                content += results.join('');
                setValue(content.trim());
            } catch (e) {
                console.error("Failed to process zip file", e);
                const errorMessage = `Error: Failed to read zip file "${file.name}". It may be corrupted or in an unsupported format.`;
                setValue(errorMessage);
                setFileName('');
            }
        } else { // Handle plain text files
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setValue(text);
            };
            reader.onerror = () => {
                const errorMessage = `Error: Failed to read file "${file.name}".`;
                console.error(errorMessage);
                setValue(errorMessage);
                setFileName('');
            }
            reader.readAsText(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        processFile(file);
        if (event.target) {
            event.target.value = ''; // Allow re-uploading the same file
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleClear = () => {
        setValue('');
        setFileName('');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow drop
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isLoading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div 
            className={`p-1 transition-all duration-200 ease-in-out rounded-lg ${isDragging ? 'bg-brand-primary/10 ring-2 ring-brand-primary ring-offset-2 ring-offset-base-100' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="flex justify-between items-center mb-2">
                <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
                    {label} {optionalText && <span className="text-xs opacity-80">{optionalText}</span>}
                </label>
                <div className="flex items-center space-x-2">
                    {fileName && (
                        <span className="text-xs text-text-secondary truncate max-w-[120px] sm:max-w-[200px]" title={fileName}>{fileName}</span>
                    )}
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isLoading}
                        className="flex items-center text-xs font-medium text-brand-primary hover:text-brand-secondary disabled:text-text-secondary/50 transition-colors"
                    >
                        <UploadIcon />
                        <span className="ml-1">Upload</span>
                    </button>
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isLoading}
                            className="text-text-secondary hover:text-red-400 disabled:text-text-secondary/50 transition-colors p-1"
                            aria-label="Clear content"
                        >
                            <TrashIcon />
                        </button>
                    )}
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={accept || ".js,.jsx,.ts,.tsx,.py,.java,.cs,.cpp,.c,.go,.rs,.rb,.php,.html,.css,.json,.txt,.md,.*,.zip"}
                disabled={isLoading}
            />
            <textarea
                id={id}
                rows={rows}
                className="block w-full rounded-md border-0 bg-base-200 p-4 text-text-primary shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition"
                placeholder={isDragging ? 'Drop your file here!' : placeholder}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    if (fileName) setFileName(''); 
                }}
                disabled={isLoading}
            />
        </div>
    );
};

export default FileInput;
