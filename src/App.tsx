import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Trash2, AlertCircle, Settings } from 'lucide-react';

import IPhoneMockup from './components/IPhoneMockup';
import DropdownModal from './components/DropdownModal';
import JSONModal from './components/JSONModal';
import AdminModal from './components/AdminModal';
import { initAuth } from './lib/firebase';
import {
  StaticInput,
  MultiValueRow,
  MultiAddRow,
  SelectRow,
  DateRow,
  TextAreaRow,
  FormCard,
  SwitchRow,
} from './components/FormFields';

import {
  ContactData,
  DEFAULT_CONTACT_DATA,
  LABEL_OPTIONS,
  RINGTONE_OPTIONS,
  TEXT_TONE_OPTIONS,
} from './types';

export default function App() {
  const [data, setData] = useState<ContactData>(() => {
    // Clone default state to prevent accidental mutations
    return JSON.parse(JSON.stringify(DEFAULT_CONTACT_DATA));
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal / Sheet States
  const [activeLabelPicker, setActiveLabelPicker] = useState<{
    section: 'phones' | 'emails';
    id: string;
    options: string[];
    title: string;
  } | null>(null);

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isJSONModalOpen, setIsJSONModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Firebase Auth listener on load
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Validation States
  const [errors, setErrors] = useState<{
    nameRequired: boolean;
    invalidEmails: { [id: string]: boolean };
    invalidPhones: { [id: string]: boolean };
  }>({
    nameRequired: false,
    invalidEmails: {},
    invalidPhones: {},
  });

  const [shakeTrigger, setShakeTrigger] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Dark Mode Class with state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Check if form has any changes
  const checkHasChanges = (): boolean => {
    if (data.firstName.trim() || data.lastName.trim() || data.pronouns.trim() || data.notes.trim()) {
      return true;
    }
    if (photoUrl) return true;
    if (data.phones.some(p => p.value.trim()) || data.emails.some(e => e.value.trim())) {
      return true;
    }
    if (data.talkToHuy) return true;
    return false;
  };

  // Resets contact data back to default
  const resetForm = () => {
    setData(JSON.parse(JSON.stringify(DEFAULT_CONTACT_DATA)));
    setPhotoUrl(null);
    setErrors({
      nameRequired: false,
      invalidEmails: {},
      invalidPhones: {},
    });
  };

  // Discard action handler
  const handleCancelClick = () => {
    if (checkHasChanges()) {
      setIsDiscardConfirmOpen(true);
    } else {
      resetForm();
    }
  };

  const handleConfirmDiscard = () => {
    resetForm();
    setIsDiscardConfirmOpen(false);
  };

  // Dynamic field add functions
  const addPhone = () => {
    setData(prev => ({
      ...prev,
      phones: [...prev.phones, { id: Date.now().toString(), label: 'di động', value: '' }],
    }));
  };

  const addEmail = () => {
    setData(prev => ({
      ...prev,
      emails: [...prev.emails, { id: Date.now().toString(), label: 'nhà', value: '' }],
    }));
  };

  // Field change handlers
  const updateMultiValue = (
    section: 'phones' | 'emails',
    id: string,
    value: string
  ) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map(item => (item.id === id ? { ...item, value } : item)),
    }));

    // Clear validation error if fixed
    if (section === 'emails') {
      setErrors(prev => {
        const copy = { ...prev.invalidEmails };
        delete copy[id];
        return { ...prev, invalidEmails: copy };
      });
    } else if (section === 'phones') {
      setErrors(prev => {
        const copy = { ...prev.invalidPhones };
        delete copy[id];
        return { ...prev, invalidPhones: copy };
      });
    }
  };

  const removeMultiValue = (
    section: 'phones' | 'emails',
    id: string
  ) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id),
    }));
  };

  // Photo handlers
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submission / Validation
  const handleDoneClick = async () => {
    const nameReq = !data.firstName.trim() && !data.lastName.trim();
    const badEmails: { [id: string]: boolean } = {};
    const badPhones: { [id: string]: boolean } = {};

    // Validate email structures
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    data.emails.forEach(e => {
      if (e.value.trim() && !emailRegex.test(e.value.trim())) {
        badEmails[e.id] = true;
      }
    });

    // Validate phone structures (at least 5 characters/digits if provided)
    const phoneRegex = /^[\d\s+\-()]{5,}$/;
    data.phones.forEach(p => {
      if (p.value.trim() && !phoneRegex.test(p.value.trim())) {
        badPhones[p.id] = true;
      }
    });

    const hasErrors = nameReq || Object.keys(badEmails).length > 0 || Object.keys(badPhones).length > 0;

    if (hasErrors) {
      setErrors({
        nameRequired: nameReq,
        invalidEmails: badEmails,
        invalidPhones: badPhones,
      });
      // Trigger visual shake keyframes on form chassis
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          pronouns: data.pronouns,
          phones: data.phones.map(p => ({ label: p.label, value: p.value })),
          emails: data.emails.map(e => ({ label: e.label, value: e.value })),
          notes: data.notes,
          talkToHuy: data.talkToHuy,
        }),
      });

      if (response.ok) {
        // Clear form
        resetForm();
        setAlertMessage('Đã tạo liên hệ thành công! Dữ liệu đã được lưu về máy chủ của Huy.');
      } else {
        throw new Error('Lỗi từ máy chủ khi lưu liên hệ');
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi liên hệ:', err);
      setErrors({
        nameRequired: true,
        invalidEmails: {},
        invalidPhones: {},
      });
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shaking animation parameters
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, -5, 5, 0],
      transition: { duration: 0.4 },
    },
    idle: { x: 0 },
  };

  return (
    <IPhoneMockup isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      {/* App Layout wrapped inside Phone Viewport */}
      <motion.div
        animate={shakeTrigger ? 'shake' : 'idle'}
        variants={shakeVariants}
        className="w-full h-full bg-[#F2F2F7] dark:bg-black flex flex-col relative overflow-hidden font-sans select-none"
      >
        {/* Navigation / Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#D1D1D6]/40 dark:border-[#38383A]/60 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-md shrink-0 sticky top-0 z-20">
          <button
            type="button"
            onClick={handleCancelClick}
            className="text-ios-accent text-[17px] font-normal hover:opacity-75 active:scale-95 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <h1 className="text-[17px] font-bold text-black dark:text-white pl-6">
            Liên hệ mới
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="text-[#8E8E93] hover:text-ios-accent p-1 transition-colors cursor-pointer"
              title="Cài đặt đồng bộ Google Sheets"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={handleDoneClick}
              disabled={isSubmitting}
              className={`text-ios-accent text-[17px] font-bold active:scale-95 transition-all cursor-pointer ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-75'
              }`}
            >
              {isSubmitting ? '...' : 'Xong'}
            </button>
          </div>
        </div>

        {/* Scrollable Form body */}
        <div className="flex-1 overflow-y-auto ios-scroll px-4 pb-12 pt-5">
          {/* Circular Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={handlePhotoClick}
              className="relative w-24 h-24 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] flex items-center justify-center cursor-pointer shadow-xs overflow-hidden group hover:opacity-90 active:scale-95 transition-all"
            >
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="Contact Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera size={18} />
                  </div>
                </>
              ) : (
                <User size={44} className="text-[#8E8E93] dark:text-[#8E8E93]/80" />
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePhotoClick}
                className="text-ios-accent font-semibold text-[14px] hover:underline"
              >
                {photoUrl ? 'Thay đổi ảnh' : 'Thêm ảnh'}
              </button>
              {photoUrl && (
                <>
                  <span className="text-[#D1D1D6] text-xs">|</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-ios-red font-semibold text-[14px] flex items-center gap-1 hover:underline"
                  >
                    <Trash2 size={13} />
                    <span>Xóa</span>
                  </button>
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Validation Banner if names missing */}
          {errors.nameRequired && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-ios-red/10 border border-ios-red/20 rounded-xl p-3 flex items-center gap-2.5"
            >
              <AlertCircle size={16} className="text-ios-red shrink-0" />
              <span className="text-[13px] text-ios-red font-semibold">
                Yêu cầu nhập Họ hoặc Tên
              </span>
            </motion.div>
          )}

          {/* Core Name Card */}
          <FormCard>
            <StaticInput
              placeholder="Họ"
              value={data.firstName}
              onChange={(val) => {
                setData(prev => ({ ...prev, firstName: val }));
                if (errors.nameRequired && (val.trim() || data.lastName.trim())) {
                  setErrors(prev => ({ ...prev, nameRequired: false }));
                }
              }}
              idAttr="first-name-input"
            />
            <StaticInput
              placeholder="Tên"
              value={data.lastName}
              onChange={(val) => {
                setData(prev => ({ ...prev, lastName: val }));
                if (errors.nameRequired && (data.firstName.trim() || val.trim())) {
                  setErrors(prev => ({ ...prev, nameRequired: false }));
                }
              }}
              idAttr="last-name-input"
            />
            <StaticInput
              placeholder="Danh xưng"
              value={data.pronouns}
              onChange={(val) => setData(prev => ({ ...prev, pronouns: val }))}
              idAttr="pronouns-input"
            />
          </FormCard>

          {/* Phone Numbers Section */}
          <FormCard>
            <AnimatePresence initial={false}>
              {data.phones.map((phone) => (
                <div key={phone.id} className="relative">
                  <MultiValueRow
                    field={phone}
                    type="tel"
                    placeholder="Điện thoại"
                    onValueChange={(val) => updateMultiValue('phones', phone.id, val)}
                    onLabelClick={() =>
                      setActiveLabelPicker({
                        section: 'phones',
                        id: phone.id,
                        options: LABEL_OPTIONS.phone,
                        title: 'Nhãn điện thoại',
                      })
                    }
                    onRemove={() => removeMultiValue('phones', phone.id)}
                  />
                  {errors.invalidPhones[phone.id] && (
                    <div className="bg-ios-red/5 px-4 py-1.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-ios-red" />
                      <span className="text-[11px] text-ios-red font-semibold">
                        Nhập định dạng số điện thoại hợp lệ
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </AnimatePresence>
            <MultiAddRow label="thêm số điện thoại" onAdd={addPhone} />
          </FormCard>

          {/* Emails Section */}
          <FormCard>
            <AnimatePresence initial={false}>
              {data.emails.map((email) => (
                <div key={email.id} className="relative">
                  <MultiValueRow
                    field={email}
                    type="email"
                    placeholder="Email"
                    onValueChange={(val) => updateMultiValue('emails', email.id, val)}
                    onLabelClick={() =>
                      setActiveLabelPicker({
                        section: 'emails',
                        id: email.id,
                        options: LABEL_OPTIONS.email,
                        title: 'Nhãn email',
                      })
                    }
                    onRemove={() => removeMultiValue('emails', email.id)}
                  />
                  {errors.invalidEmails[email.id] && (
                    <div className="bg-ios-red/5 px-4 py-1.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-ios-red" />
                      <span className="text-[11px] text-ios-red font-semibold">
                        Nhập định dạng email hợp lệ
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </AnimatePresence>
            <MultiAddRow label="thêm email" onAdd={addEmail} />
          </FormCard>

          {/* Special Option Section */}
          <FormCard title="Trò chuyện">
            <SwitchRow
              label="Hà có thít nói chuyện với Huy 🙄"
              value={data.talkToHuy}
              onChange={(val) => setData(prev => ({ ...prev, talkToHuy: val }))}
            />
          </FormCard>

          {/* Notes Card */}
          <FormCard title="Ghi chú">
            <TextAreaRow
              placeholder="Ghi chú"
              value={data.notes}
              onChange={(val) => setData(prev => ({ ...prev, notes: val }))}
            />
          </FormCard>
        </div>
      </motion.div>

      {/* 1. Labels Picker Modal (Bottom Sheet) */}
      <DropdownModal
        isOpen={activeLabelPicker !== null}
        onClose={() => setActiveLabelPicker(null)}
        title={activeLabelPicker?.title || ''}
        options={activeLabelPicker?.options || []}
        selectedOption={
          activeLabelPicker
            ? data[activeLabelPicker.section].find(item => item.id === activeLabelPicker.id)?.label || ''
            : ''
        }
        onSelect={(label) => {
          if (activeLabelPicker) {
            const { section, id } = activeLabelPicker;
            setData(prev => ({
              ...prev,
              [section]: prev[section].map(item => (item.id === id ? { ...item, label } : item)),
            }));
          }
        }}
        allowCustom={true}
      />

      {/* 3. Discard Changes Confirmation bottom Sheet (Action Sheet style) */}
      <AnimatePresence>
        {isDiscardConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDiscardConfirmOpen(false)}
              className="absolute inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-transparent z-50 flex flex-col gap-2.5 shrink-0"
            >
              {/* Primary action list */}
              <div className="bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl overflow-hidden divide-y divide-[#D1D1D6]/40 dark:divide-[#38383A]/40">
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-ios-text-secondary font-medium">
                    Bạn có chắc chắn muốn hủy các thay đổi? Mọi chỉnh sửa sẽ bị mất.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="w-full py-3.5 text-center text-ios-red font-semibold text-[17px] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]/50 transition-colors"
                >
                  Hủy thay đổi
                </button>
              </div>

              {/* Cancel item */}
              <button
                type="button"
                onClick={() => setIsDiscardConfirmOpen(false)}
                className="w-full py-3.5 text-center text-ios-accent font-bold text-[17px] bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xs hover:opacity-95 transition-opacity"
              >
                Hủy
              </button>

              {/* Spacer */}
              <div className="h-2 shrink-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Final Output JSON modal */}
      <JSONModal
        isOpen={isJSONModalOpen}
        onClose={() => setIsJSONModalOpen(false)}
        data={data}
      />

      {/* 5. Admin and Google Sheets Sync Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* 6. iOS Success/Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <>
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertMessage(null)}
              className="absolute inset-0 bg-black z-[100] cursor-pointer"
            />
            {/* Centered iOS Alert Box */}
            <div className="absolute inset-0 flex items-center justify-center p-6 z-[110] pointer-events-none">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="pointer-events-auto w-full max-w-[270px] bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl rounded-[14px] overflow-hidden shadow-xl text-center flex flex-col"
              >
                <div className="p-4 space-y-1">
                  <h4 className="text-[17px] font-bold text-black dark:text-white">
                    Thông báo
                  </h4>
                  <p className="text-[13px] leading-relaxed text-black/80 dark:text-white/80">
                    {alertMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className="w-full py-3 text-center text-[17px] font-semibold text-ios-accent border-t border-[#D1D1D6]/40 dark:border-[#38383A]/40 active:bg-neutral-100 dark:active:bg-[#2C2C2E]/40 transition-colors cursor-pointer"
                >
                  OK
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </IPhoneMockup>
  );
}
