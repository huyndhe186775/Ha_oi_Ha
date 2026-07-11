import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  X, 
  Settings, 
  RefreshCw, 
  Check, 
  Trash2, 
  CloudLightning, 
  FileSpreadsheet, 
  UserCheck, 
  Lock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { googleSignIn, logout, getAccessToken } from '../lib/firebase';
import { findSpreadsheet, createSpreadsheet, appendContactsToSheet, SyncContact } from '../lib/googleSheets';

const SPREADSHEET_NAME = 'Danh sách liên hệ iOS App';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerContact extends SyncContact {
  id: string;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [contacts, setContacts] = useState<ServerContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('google_spreadsheet_id');
  });
  const [syncedIds, setSyncedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('synced_contact_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch submitted contacts from our server API
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải liên hệ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // On modal open, load contacts and check cached token
  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      const token = getAccessToken();
      if (token) {
        setAccessToken(token);
      }
    }
  }, [isOpen]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        
        // Auto check/create sheet
        await handleSetupSpreadsheet(result.accessToken);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMessage(error.message || 'Đăng nhập thất bại.');
    }
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setAccessToken(null);
    setSpreadsheetId(null);
    localStorage.removeItem('google_spreadsheet_id');
  };

  // Find or Create Spreadsheet
  const handleSetupSpreadsheet = async (token: string) => {
    try {
      let sheetId = await findSpreadsheet(token);
      if (!sheetId) {
        sheetId = await createSpreadsheet(token);
      }
      setSpreadsheetId(sheetId);
      localStorage.setItem('google_spreadsheet_id', sheetId);
    } catch (err: any) {
      console.error('Sheet setup failed:', err);
      setErrorMessage('Không thể tìm hoặc tạo Google Sheet. Vui lòng thử lại.');
    }
  };

  // Sync pending contacts to Google Sheet
  const handleSync = async () => {
    if (!accessToken || !spreadsheetId) return;

    const pendingContacts = contacts.filter(c => !syncedIds.includes(c.id));
    if (pendingContacts.length === 0) return;

    setSyncing(true);
    setSyncStatus('idle');
    setErrorMessage('');

    try {
      await appendContactsToSheet(accessToken, spreadsheetId, pendingContacts);
      
      // Update local synced status
      const newlySynced = [...syncedIds, ...pendingContacts.map(c => c.id)];
      setSyncedIds(newlySynced);
      localStorage.setItem('synced_contact_ids', JSON.stringify(newlySynced));
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'Đồng bộ thất bại. Vui lòng kiểm tra quyền truy cập.');
    } finally {
      setSyncing(false);
    }
  };

  // Delete a submission
  const handleDeleteContact = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa liên hệ này khỏi máy chủ?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
        // Remove from synced ids just in case
        const updatedSynced = syncedIds.filter(syncedId => syncedId !== id);
        setSyncedIds(updatedSynced);
        localStorage.setItem('synced_contact_ids', JSON.stringify(updatedSynced));
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const pendingCount = contacts.filter(c => !syncedIds.includes(c.id)).length;

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
              className="pointer-events-auto w-full max-w-md bg-[#F2F2F7] dark:bg-black rounded-3xl overflow-hidden shadow-2xl border border-[#D1D1D6]/50 dark:border-[#38383A]/50 flex flex-col h-[85%] max-h-[750px]"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-white dark:bg-[#1E1E1E] border-b border-[#D1D1D6]/40 dark:border-[#38383A]/40 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-[17px] font-bold text-black dark:text-white">
                    Cài đặt & Đồng bộ
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Quản lý liên hệ & Google Sheets
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] hover:opacity-80 text-black dark:text-white transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 ios-scroll space-y-4">
                
                {/* 1. Google Workspace Connection Card */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-xs border border-neutral-200/40 dark:border-neutral-800/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-[#34C759]/10 text-[#34C759]">
                      <FileSpreadsheet size={22} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-black dark:text-white">
                        Liên kết Google Sheets
                      </h4>
                      <p className="text-xs text-[#8E8E93]">
                        Tự động tạo và cập nhật danh sách
                      </p>
                    </div>
                  </div>

                  {!accessToken ? (
                    <div className="space-y-3">
                      <p className="text-xs text-[#8E8E93] leading-relaxed">
                        Đăng nhập tài khoản Google của bạn để tự động tạo một trang tính mang tên <span className="font-semibold text-black dark:text-white">"{SPREADSHEET_NAME}"</span> trong Google Drive để lưu tất cả dữ liệu.
                      </p>
                      
                      {errorMessage && (
                        <div className="p-2.5 bg-ios-red/10 border border-ios-red/20 rounded-xl flex items-center gap-2 text-xs text-ios-red">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 px-4 bg-ios-accent hover:bg-ios-accent/90 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <UserCheck size={16} />
                        Đăng nhập bằng Google
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Signed-In Info */}
                      <div className="flex items-center justify-between p-2.5 bg-[#F2F2F7] dark:bg-black/30 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-ios-accent text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            G
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-black dark:text-white">
                              Đã kết nối Google
                            </p>
                            <p className="text-[10px] text-[#8E8E93]">
                              Sẵn sàng đồng bộ trang tính
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleGoogleLogout}
                          className="p-2 text-[#8E8E93] hover:text-ios-red rounded-lg hover:bg-ios-red/5 transition-colors"
                          title="Đăng xuất"
                        >
                          <LogOut size={16} />
                        </button>
                      </div>

                      {/* Spreadsheet Link if setup */}
                      {spreadsheetId ? (
                        <div className="p-3 border border-[#34C759]/30 bg-[#34C759]/5 rounded-xl space-y-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#34C759] uppercase tracking-wider">
                              Trang tính đã kết nối
                            </span>
                            <a 
                              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs text-ios-accent font-semibold flex items-center gap-0.5 hover:underline"
                            >
                              <span>Mở Sheets</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                          <p className="text-xs font-medium text-black dark:text-white truncate">
                            {SPREADSHEET_NAME}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 border border-[#FF9500]/30 bg-[#FF9500]/5 rounded-xl text-left">
                          <p className="text-xs text-[#FF9500] font-semibold">
                            Đang chuẩn bị trang tính...
                          </p>
                        </div>
                      )}

                      {/* Sync triggers */}
                      {spreadsheetId && (
                        <div className="pt-1.5">
                          <button
                            onClick={handleSync}
                            disabled={syncing || pendingCount === 0}
                            className={`w-full py-3 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs ${
                              pendingCount === 0
                                ? 'bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed'
                                : 'bg-[#34C759] hover:bg-[#34C759]/90 text-white cursor-pointer active:scale-98'
                            }`}
                          >
                            {syncing ? (
                              <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Đang đồng bộ...</span>
                              </>
                            ) : syncStatus === 'success' ? (
                              <>
                                <Check size={16} />
                                <span>Đã đồng bộ xong!</span>
                              </>
                            ) : (
                              <>
                                <CloudLightning size={16} />
                                <span>Đồng bộ {pendingCount} liên hệ mới</span>
                              </>
                            )}
                          </button>

                          {pendingCount === 0 && (
                            <p className="text-[11px] text-center text-[#8E8E93] mt-2 font-medium">
                              ✓ Toàn bộ liên hệ đã được đồng bộ lên Google Sheets.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Contact List Card */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-xs border border-neutral-200/40 dark:border-neutral-800/40">
                  <div className="px-4 py-3 border-b border-[#D1D1D6]/40 dark:border-[#38383A]/40 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-black dark:text-white">
                      Danh sách liên hệ ({contacts.length})
                    </span>
                    <button
                      onClick={fetchContacts}
                      disabled={isLoading}
                      className="p-1 text-ios-accent hover:opacity-80 transition-opacity"
                    >
                      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="divide-y divide-[#D1D1D6]/30 dark:divide-[#38383A]/30 max-h-[250px] overflow-y-auto ios-scroll">
                    {isLoading && contacts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#8E8E93]">
                        Đang tải danh sách...
                      </div>
                    ) : contacts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#8E8E93]">
                        Chưa có liên hệ nào được gửi.
                      </div>
                    ) : (
                      contacts.map((c) => {
                        const isSynced = syncedIds.includes(c.id);
                        return (
                          <div key={c.id} className="p-3 flex items-center justify-between text-left">
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-black dark:text-white truncate">
                                  {c.lastName} {c.firstName}
                                </p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isSynced 
                                    ? 'bg-[#34C759]/10 text-[#34C759]' 
                                    : 'bg-[#FF9500]/10 text-[#FF9500]'
                                }`}>
                                  {isSynced ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
                                </span>
                              </div>
                              
                              {c.phones.length > 0 && c.phones[0].value && (
                                <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">
                                  {c.phones[0].label}: {c.phones[0].value}
                                </p>
                              )}
                              
                              {c.talkToHuy && (
                                <p className="text-[10px] text-[#34C759] font-medium mt-0.5">
                                  ♥ Muốn nói chuyện với Huy
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-2 text-[#8E8E93] hover:text-ios-red rounded-lg hover:bg-ios-red/5 transition-colors"
                              title="Xóa khỏi hệ thống"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Close Button Footer */}
              <div className="p-4 bg-white dark:bg-[#1E1E1E] border-t border-[#D1D1D6]/40 dark:border-[#38383A]/40 shrink-0">
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
