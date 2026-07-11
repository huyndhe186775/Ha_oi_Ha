import { AnimatePresence, motion } from 'motion/react';
import { X, Check } from 'lucide-react';

interface DropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  allowCustom?: boolean;
}

export default function DropdownModal({
  isOpen,
  onClose,
  title,
  options,
  selectedOption,
  onSelect,
  allowCustom = false,
}: DropdownModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40 cursor-pointer"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="absolute bottom-0 left-0 right-0 max-h-[70%] bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[16px] flex flex-col z-50 shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1D1D6] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] shrink-0">
              <span className="text-base font-semibold text-black dark:text-white">
                {title}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* List options container */}
            <div className="overflow-y-auto ios-scroll flex-1 py-2 px-4 space-y-2">
              <div className="bg-white dark:bg-[#2C2C2E] rounded-xl overflow-hidden divide-y divide-[#D1D1D6] dark:divide-[#38383A]">
                {options.map((option) => {
                  const isSelected = option.toLowerCase() === selectedOption.toLowerCase();
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        onSelect(option);
                        onClose();
                      }}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-colors"
                    >
                      <span className={`text-[15px] ${isSelected ? 'font-semibold text-ios-accent' : 'text-black dark:text-white'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <Check size={16} className="text-ios-accent font-bold" />
                      )}
                    </button>
                  );
                })}
              </div>

              {allowCustom && (
                <div className="bg-white dark:bg-[#2C2C2E] rounded-xl p-3">
                  <span className="text-xs text-ios-text-secondary uppercase px-1 block mb-2 font-medium">
                    Hoặc dùng nhãn tùy chỉnh
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Thêm nhãn tùy chỉnh..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            onSelect(val);
                            onClose();
                          }
                        }
                      }}
                      className="flex-1 bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-transparent rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-ios-accent"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          onSelect(val);
                          onClose();
                        }
                      }}
                      className="px-3 py-2 bg-ios-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Safe Area Spacer */}
            <div className="h-5 bg-white dark:bg-[#1C1C1E] shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
