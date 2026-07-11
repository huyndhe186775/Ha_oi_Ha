export interface MultiValueField {
  id: string;
  label: string;
  value: string;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  pronouns: string;
  phones: MultiValueField[];
  emails: MultiValueField[];
  notes: string;
  talkToHuy: boolean;
}

export const DEFAULT_CONTACT_DATA: ContactData = {
  firstName: '',
  lastName: '',
  pronouns: '',
  phones: [{ id: '1', label: 'di động', value: '' }],
  emails: [{ id: '1', label: 'nhà', value: '' }],
  notes: '',
  talkToHuy: false,
};

export const LABEL_OPTIONS = {
  phone: ['di động', 'nhà', 'việc làm', 'trường học', 'iPhone', 'chính', 'fax nhà', 'fax việc làm', 'máy nhắn tin', 'khác'],
  email: ['nhà', 'việc làm', 'trường học', 'iCloud', 'khác'],
};


export const RINGTONE_OPTIONS = [
  'Mặc định (Phản chiếu)',
  'Phản chiếu',
  'Chông',
  'Đỉnh cao',
  'Hải đăng',
  'Bản tin',
  'Chòm sao',
  'Vũ trụ',
  'Pha lê',
  'Sườn đồi',
  'Chiếu sáng',
  'Dải Ngân Hà',
  'Cú đêm',
  'Giờ chơi',
  'Tia sáng',
  'Gợn sóng',
  'Trà sen',
  'Tín hiệu',
  'Tơ lụa',
  'Khởi đầu chậm',
  'Ngắm sao',
  'Hội nghị',
  'Tổng hợp',
  'Sóng biển',
];

export const TEXT_TONE_OPTIONS = [
  'Mặc định (Ghi chú)',
  'Ghi chú',
  'Cực quang',
  'Cây tre',
  'Hợp âm',
  'Vòng tròn',
  'Hoàn thành',
  'Đầu vào',
  'Phím đàn',
  'Bắp rang',
  'Nhịp điệu',
  'Nhạc tổng hợp',
  'Giờ uống trà',
];
