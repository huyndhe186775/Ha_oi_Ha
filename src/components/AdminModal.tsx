import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  X, 
  Settings, 
  RefreshCw, 
  Check, 
  Trash2, 
  FileSpreadsheet, 
  Lock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clipboard,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerContact {
  id: string;
  firstName: string;
  lastName: string;
  pronouns: string;
  phones: { label: string; value: string }[];
  emails: { label: string; value: string }[];
  notes: string;
  talkToHuy: boolean;
  createdAt: string;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [contacts, setContacts] = useState<ServerContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings state
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('1234');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security Lock state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('admin_unlocked') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [newPasscodeInput, setNewPasscodeInput] = useState('');
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);

  // Copied indicator state
  const [copied, setCopied] = useState(false);

  // Load settings and contacts
  const loadSettingsAndContacts = async () => {
    try {
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.googleSheetsUrl) setGoogleSheetsUrl(settingsData.googleSheetsUrl);
        if (settingsData.adminPasscode) {
          setAdminPasscode(settingsData.adminPasscode);
        }
      }

      const contactsRes = await fetch('/api/contacts');
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSettingsAndContacts();
      setPasscodeInput('');
      setLoginError('');
    }
  }, [isOpen]);

  // Google Apps Script template for Huy to copy
  const appsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tạo dòng tiêu đề nếu bảng tính trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Họ", 
        "Tên", 
        "Danh xưng", 
        "Số điện thoại", 
        "Email", 
        "Ghi chú", 
        "Muốn nói chuyện với Huy?", 
        "Thời gian gửi"
      ]);
      // Định dạng đậm cho tiêu đề
      sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#F2F2F7");
    }
    
    // Thêm dữ liệu liên hệ mới
    sheet.appendRow([
      data.lastName || "",
      data.firstName || "",
      data.pronouns || "",
      data.phones || "",
      data.emails || "",
      data.notes || "",
      data.talkToHuy || "Không",
      data.createdAt || new Date().toISOString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Unlock Admin panel
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === adminPasscode || passcodeInput === '1234') {
      setIsUnlocked(true);
      sessionStorage.setItem('admin_unlocked', 'true');
      setLoginError('');
    } else {
      setLoginError('Mã bảo mật không chính xác. Thử lại hoặc dùng mã mặc định.');
    }
  };

  // Lock admin panel on logout
  const handleLockAdmin = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('admin_unlocked');
    setPasscodeInput('');
  };

  // Save Settings to server (Vercel/Firestore)
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleSheetsUrl: googleSheetsUrl.trim(),
          adminPasscode: adminPasscode
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Lỗi lưu cấu hình');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Không thể lưu cấu hình về máy chủ.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Update passcode
  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscodeInput.trim()) return;
    setIsUpdatingPasscode(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleSheetsUrl: googleSheetsUrl,
          adminPasscode: newPasscodeInput.trim()
        }),
      });

      if (response.ok) {
        setAdminPasscode(newPasscodeInput.trim());
        setNewPasscodeInput('');
        alert('Đã đổi mã bảo mật thành công!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi đổi mã bảo mật.');
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  // Delete contact from server
  const handleDeleteContact = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa liên hệ này khỏi máy chủ của bạn?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
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
              className="pointer-events-auto w-full max-w-md bg-[#F2F2F7] dark:bg-[#121212] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/50 dark:border-neutral-800/50 flex flex-col h-[85%] max-h-[750px]"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-white dark:bg-[#1C1C1E] border-b border-[#D1D1D6]/40 dark:border-[#38383A]/40 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-[17px] font-bold text-black dark:text-white flex items-center gap-1.5">
                    <Settings size={18} className="text-ios-accent" />
                    <span>Quản trị của Huy</span>
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    {isUnlocked ? 'Cấu hình đồng bộ & Danh sách dữ liệu' : 'Bảo mật quyền truy cập'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] hover:opacity-80 text-black dark:text-white transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Security Lock View (PIN input) */}
              {!isUnlocked ? (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center space-y-6">
                  <div className="p-4 rounded-full bg-ios-accent/10 text-ios-accent">
                    <Lock size={36} />
                  </div>
                  
                  <div className="text-center space-y-1.5 max-w-[280px]">
                    <h4 className="text-[16px] font-bold text-black dark:text-white">
                      Yêu cầu Mã bảo mật
                    </h4>
                    <p className="text-xs text-[#8E8E93] leading-relaxed">
                      Để bảo vệ sự riêng tư của mọi người, vui lòng nhập mã PIN bảo mật để xem và quản lý liên hệ.
                    </p>
                    <p className="text-[11px] text-ios-accent bg-ios-accent/5 py-1 px-2.5 rounded-lg inline-block font-medium mt-1">
                      Mã mặc định: <span className="font-bold">1234</span>
                    </p>
                  </div>

                  <form onSubmit={handleUnlock} className="w-full space-y-4 max-w-[280px]">
                    <div className="relative">
                      <input
                        type={showPasscode ? 'text' : 'password'}
                        value={passcodeInput}
                        onChange={(e) => setPasscodeInput(e.target.value)}
                        placeholder="Nhập mã bảo mật..."
                        className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#D1D1D6]/40 dark:border-[#38383A]/40 text-center font-mono text-lg tracking-wider focus:outline-hidden focus:ring-1 focus:ring-ios-accent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
                      >
                        {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {loginError && (
                      <p className="text-xs text-ios-red text-center font-medium">
                        {loginError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-ios-accent hover:bg-ios-accent/90 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                      Xác thực quản trị
                    </button>
                  </form>
                </div>
              ) : (
                /* Unlocked Admin Panel Content */
                <div className="flex-1 overflow-y-auto p-4 ios-scroll space-y-5">
                  
                  {/* 1. Auto Sync Configuration Card */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-xs border border-neutral-200/40 dark:border-neutral-800/40 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#34C759]/10 text-[#34C759]">
                        <FileSpreadsheet size={22} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-black dark:text-white">
                          Liên kết Google Sheets tự động
                        </h4>
                        <p className="text-xs text-[#8E8E93]">
                          Không cần đăng nhập, tự động đồng bộ ngay lập tức!
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-1.5">
                      {/* Web App URL Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          Google Sheets Web App URL:
                        </label>
                        <input
                          type="url"
                          value={googleSheetsUrl}
                          onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="w-full py-2.5 px-3 rounded-xl bg-[#F2F2F7] dark:bg-black border border-neutral-200/40 dark:border-neutral-800/40 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-ios-accent"
                        />
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="w-full py-2.5 bg-ios-accent text-white font-bold text-xs rounded-xl hover:bg-ios-accent/90 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                      >
                        {isSavingSettings ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : saveSuccess ? (
                          <Check size={14} />
                        ) : null}
                        <span>{isSavingSettings ? 'Đang lưu...' : saveSuccess ? 'Đã lưu thành công!' : 'Lưu URL cấu hình'}</span>
                      </button>

                      {/* Apps Script Guide */}
                      <div className="p-3 bg-[#F2F2F7] dark:bg-black/40 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-ios-accent uppercase tracking-wider">
                            Hướng dẫn thiết lập (30 giây)
                          </span>
                          <button
                            onClick={copyToClipboard}
                            className="text-[11px] text-neutral-500 hover:text-ios-accent flex items-center gap-1 transition-colors"
                          >
                            <Clipboard size={12} />
                            <span>{copied ? 'Đã copy!' : 'Sao chép mã'}</span>
                          </button>
                        </div>
                        
                        <ol className="text-[11px] text-[#8E8E93] list-decimal pl-4 space-y-1.5 leading-relaxed">
                          <li>Mở <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-ios-accent underline inline-flex items-center gap-0.5">Google Sheets<ExternalLink size={10} /></a> và tạo 1 file trống mới.</li>
                          <li>Chọn menu <span className="font-semibold text-black dark:text-white">Tiện ích mở rộng (Extensions)</span> → <span className="font-semibold text-black dark:text-white">Apps Script</span>.</li>
                          <li>Xóa hết code có sẵn đi, dán toàn bộ đoạn code phía trên vào rồi lưu lại.</li>
                          <li>Nhấn nút <span className="font-semibold text-black dark:text-white">Triển khai (Deploy)</span> ở góc trên bên phải → <span className="font-semibold text-black dark:text-white">Triển khai mới (New deployment)</span>.</li>
                          <li>Chọn loại là <span className="font-semibold text-black dark:text-white">Ứng dụng Web (Web app)</span>.</li>
                          <li>Đặt cấu hình: 
                            <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                              <li>Quyền thực thi (Execute as): <span className="font-semibold text-black dark:text-white">Tôi (Me)</span></li>
                              <li>Ai có quyền truy cập (Who has access): <span className="font-semibold text-black dark:text-white">Bất kỳ ai (Anyone)</span></li>
                            </ul>
                          </li>
                          <li>Nhấn nút Triển khai (Deploy), cấp quyền nếu có, sau đó <span className="font-semibold text-black dark:text-white">sao chép URL Ứng dụng Web</span> và dán vào ô nhập bên trên của bạn!</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* 2. Submissions list */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-xs border border-neutral-200/40 dark:border-neutral-800/40">
                    <div className="px-4 py-3 border-b border-[#D1D1D6]/40 dark:border-[#38383A]/40 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-black dark:text-white">
                        Danh sách liên hệ đã gửi ({contacts.length})
                      </span>
                      <button
                        onClick={loadSettingsAndContacts}
                        disabled={isLoading}
                        className="p-1 text-ios-accent hover:opacity-80 transition-opacity"
                      >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    <div className="divide-y divide-[#D1D1D6]/30 dark:divide-[#38383A]/30 max-h-[220px] overflow-y-auto ios-scroll">
                      {contacts.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#8E8E93]">
                          Chưa có liên hệ nào được gửi tới máy chủ.
                        </div>
                      ) : (
                        contacts.map((c) => (
                          <div key={c.id} className="p-3 flex items-start justify-between text-left gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-black dark:text-white truncate">
                                {c.lastName} {c.firstName} {c.pronouns && <span className="text-xs font-normal text-[#8E8E93] ml-1">({c.pronouns})</span>}
                              </p>
                              
                              {c.phones.length > 0 && c.phones[0].value && (
                                <p className="text-[11px] text-neutral-500 mt-1">
                                  📞 {c.phones.map(p => `${p.label}: ${p.value}`).join(' | ')}
                                </p>
                              )}

                              {c.emails.length > 0 && c.emails[0].value && (
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  ✉ {c.emails.map(e => `${e.label}: ${e.value}`).join(' | ')}
                                </p>
                              )}

                              {c.notes && (
                                <p className="text-[11px] text-neutral-500 italic mt-1 bg-neutral-50 dark:bg-neutral-900 p-1.5 rounded-lg">
                                  📝 {c.notes}
                                </p>
                              )}
                              
                              {c.talkToHuy && (
                                <p className="text-[10px] text-ios-accent font-semibold mt-1">
                                  ❤️ Muốn nói chuyện với Huy!
                                </p>
                              )}

                              <p className="text-[9px] text-[#8E8E93] mt-1.5">
                                Đã gửi lúc: {new Date(c.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1.5 text-[#8E8E93] hover:text-ios-red rounded-lg hover:bg-ios-red/5 transition-colors shrink-0"
                              title="Xóa liên hệ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 3. Security Settings Card */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-xs border border-neutral-200/40 dark:border-neutral-800/40 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-ios-red/10 text-ios-red">
                        <KeyRound size={20} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-black dark:text-white">
                          Mã bảo mật Admin (Passcode)
                        </h4>
                        <p className="text-xs text-[#8E8E93]">
                          Thay đổi mã PIN truy cập màn hình này
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePasscode} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Mã PIN mới (ví dụ: 5555)"
                        value={newPasscodeInput}
                        onChange={(e) => setNewPasscodeInput(e.target.value)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#F2F2F7] dark:bg-black border border-neutral-200/40 dark:border-neutral-800/40 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-ios-accent"
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingPasscode}
                        className="px-4 bg-neutral-200 dark:bg-[#2C2C2E] text-black dark:text-white font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0"
                      >
                        {isUpdatingPasscode ? 'Đang cập nhật...' : 'Đổi mã'}
                      </button>
                    </form>
                  </div>

                  {/* Lock Admin Panel Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleLockAdmin}
                      className="w-full py-3 bg-neutral-200 dark:bg-[#2C2C2E] hover:bg-neutral-300 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} />
                      <span>Khóa quyền Quản trị (Đăng xuất)</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Close Button Footer */}
              <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-[#D1D1D6]/40 dark:border-[#38383A]/40 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 text-center text-base font-bold text-ios-accent hover:opacity-90 transition-opacity bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl"
                >
                  Xong
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
