import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Copy, Check, Download, X } from 'lucide-react';
import { ContactData } from '../types';

interface JSONModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ContactData;
}

export default function JSONModal({ isOpen, onClose, data }: JSONModalProps) {
  const [copied, setCopied] = useState(false);

  // Clean data to fit output requested
  const exportData = {
    firstName: data.firstName,
    lastName: data.lastName,
    pronouns: data.pronouns || undefined,
    phones: data.phones.map(p => ({ label: p.label, value: p.value })),
    emails: data.emails.map(e => ({ label: e.label, value: e.value })),
    notes: data.notes || undefined,
    talkToHuy: data.talkToHuy,
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.firstName || 'New'}_${data.lastName || 'Contact'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-[60] backdrop-blur-xs cursor-pointer"
          />

          {/* Dialog Container */}
          <div className="absolute inset-0 flex items-center justify-center p-4 z-[70] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="pointer-events-auto w-full max-w-sm bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-[#D1D1D6]/50 dark:border-[#38383A]/50 flex flex-col max-h-[85%]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#D1D1D6]/40 dark:border-[#38383A]/40 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    Đã tạo liên hệ!
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Dữ liệu JSON liên hệ đã lưu
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#8E8E93] dark:text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Code Panel */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#F2F2F7] dark:bg-black/40 text-left font-mono text-[11px] leading-relaxed ios-scroll">
                <pre className="text-[#3A3A3C] dark:text-[#E5E5EA] whitespace-pre-wrap select-all">
                  {jsonString}
                </pre>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 border-t border-[#D1D1D6]/40 dark:border-[#38383A]/40 divide-x divide-[#D1D1D6]/40 dark:divide-[#38383A]/40 text-center text-sm">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-3 px-4 font-semibold text-ios-accent flex items-center justify-center gap-1.5 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-ios-green" />
                      <span className="text-ios-green">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Sao chép JSON</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-3 px-4 font-semibold text-ios-accent flex items-center justify-center gap-1.5 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors"
                >
                  <Download size={16} />
                  <span>Tải xuống</span>
                </button>
              </div>

              {/* Close Button Row */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 text-center text-base font-bold text-ios-accent border-t border-[#D1D1D6]/40 dark:border-[#38383A]/40 bg-white/50 dark:bg-black/20 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
