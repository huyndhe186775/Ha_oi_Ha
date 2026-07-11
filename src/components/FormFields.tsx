import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ChevronRight } from 'lucide-react';
import { MultiValueField } from '../types';

interface StaticInputProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  idAttr?: string;
}

export function StaticInput({ placeholder, value, onChange, idAttr }: StaticInputProps) {
  return (
    <div className="relative w-full border-b border-[#E5E5EA] dark:border-[#2C2C2E] last:border-0">
      <input
        id={idAttr}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-transparent text-black dark:text-white placeholder-[#C7C7CC] dark:placeholder-[#48484A] text-[17px] outline-none focus:bg-[#F2F2F7]/40 dark:focus:bg-[#2C2C2E]/40 transition-colors"
      />
    </div>
  );
}

interface MultiValueRowProps {
  field: MultiValueField;
  type: 'tel' | 'email' | 'url' | 'text';
  placeholder: string;
  onValueChange: (val: string) => void;
  onLabelClick: () => void;
  onRemove: () => void;
  key?: string;
}

export function MultiValueRow({
  field,
  type,
  placeholder,
  onValueChange,
  onLabelClick,
  onRemove,
}: MultiValueRowProps) {
  return (
    <motion.div
      layout
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="overflow-hidden"
    >
      <div className="flex items-center px-4 py-2 min-h-[44px] gap-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E] last:border-0 bg-white dark:bg-[#1C1C1E]">
        {/* Delete button (red minus) */}
        <button
          type="button"
          onClick={onRemove}
          className="w-6 h-6 rounded-full bg-ios-red flex items-center justify-center text-white shrink-0 hover:opacity-90 active:scale-90 transition-transform cursor-pointer"
        >
          <Minus size={14} strokeWidth={3} />
        </button>

        {/* Label Selector Button */}
        <button
          type="button"
          onClick={onLabelClick}
          className="flex items-center gap-1 shrink-0 text-left text-ios-accent font-normal text-[15px] hover:opacity-80 active:scale-95 transition-all max-w-[100px] truncate"
        >
          <span className="capitalize">{field.label}</span>
          <ChevronRight size={14} className="opacity-60" />
        </button>

        {/* Dynamic separator between label and text input */}
        <div className="h-4 w-[1px] bg-[#D1D1D6] dark:bg-[#38383A] mx-1 shrink-0" />

        {/* Text input */}
        <input
          type={type}
          placeholder={placeholder}
          value={field.value}
          onChange={(e) => onValueChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-black dark:text-white placeholder-[#C7C7CC] dark:placeholder-[#48484A] text-[16px] outline-none py-1"
        />
      </div>
    </motion.div>
  );
}

interface MultiAddRowProps {
  label: string;
  onAdd: () => void;
}

export function MultiAddRow({ label, onAdd }: MultiAddRowProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full flex items-center px-4 py-3 gap-3 bg-white dark:bg-[#1C1C1E] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-left text-[16px] border-b border-[#E5E5EA] dark:border-[#2C2C2E] last:border-0 cursor-pointer transition-colors"
    >
      <div className="w-6 h-6 rounded-full bg-ios-green flex items-center justify-center text-white shrink-0">
        <Plus size={14} strokeWidth={3} />
      </div>
      <span className="text-black dark:text-white font-normal">{label}</span>
    </button>
  );
}

interface SelectRowProps {
  label: string;
  value: string;
  onClick: () => void;
}

export function SelectRow({ label, value, onClick }: SelectRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1C1C1E] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 text-left text-[16px] border-b border-[#E5E5EA] dark:border-[#2C2C2E] last:border-0 cursor-pointer transition-colors"
    >
      <span className="text-black dark:text-white">{label}</span>
      <div className="flex items-center gap-1.5 text-ios-text-secondary dark:text-ios-text-secondary/80">
        <span className="text-[15px] truncate max-w-[150px]">{value}</span>
        <ChevronRight size={16} className="opacity-60 text-ios-text-secondary" />
      </div>
    </button>
  );
}

interface DateRowProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export function DateRow({ label, value, onChange }: DateRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1C1C1E] text-left text-[16px] border-b border-[#E5E5EA] dark:border-[#2C2C2E] last:border-0">
      <span className="text-black dark:text-white">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[15px] text-ios-accent dark:text-ios-accent bg-transparent focus:outline-none cursor-pointer text-right border-0"
      />
    </div>
  );
}

interface TextAreaRowProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}

export function TextAreaRow({ placeholder, value, onChange }: TextAreaRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand mechanism
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E]">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-transparent text-black dark:text-white placeholder-[#C7C7CC] dark:placeholder-[#48484A] text-[16px] leading-normal outline-none resize-none overflow-hidden transition-all min-h-[72px]"
      />
    </div>
  );
}

interface SwitchRowProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

export function SwitchRow({ label, value, onChange }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1C1C1E] text-left text-[16px] border-b border-[#E5E5EA] dark:border-[#2C2C2E] last:border-0">
      <span className="text-black dark:text-white font-normal pr-4">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          value ? 'bg-[#34C759]' : 'bg-[#E9E9EB] dark:bg-[#39393D]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface FormCardProps {
  children: React.ReactNode;
  title?: string;
}

export function FormCard({ children, title }: FormCardProps) {
  return (
    <div className="mb-6">
      {title && (
        <span className="text-xs text-ios-text-secondary uppercase px-4 block mb-1.5 font-medium tracking-wide">
          {title}
        </span>
      )}
      <div className="ios-card bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs overflow-hidden rounded-[14px]">
        {children}
      </div>
    </div>
  );
}
