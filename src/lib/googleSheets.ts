/**
 * Utility functions for interacting with Google Drive and Google Sheets APIs
 */

export interface SyncContact {
  firstName: string;
  lastName: string;
  pronouns: string;
  phones: { label: string; value: string }[];
  emails: { label: string; value: string }[];
  talkToHuy: boolean;
  notes: string;
  createdAt?: string;
}

const SPREADSHEET_NAME = 'Danh sách liên hệ iOS App';

/**
 * Searches for an existing spreadsheet with the specified name in the user's Google Drive.
 */
export async function findSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Không thể truy vấn Google Drive');
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Lỗi tìm kiếm Google Sheets:', error);
    throw error;
  }
}

/**
 * Creates a new spreadsheet in Google Drive and initializes its headers.
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  try {
    // 1. Create spreadsheet file
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: SPREADSHEET_NAME,
        mimeType: 'application/vnd.google-apps.spreadsheet',
      }),
    });

    if (!response.ok) {
      throw new Error('Không thể tạo file trên Google Drive');
    }

    const file = await response.json();
    const spreadsheetId = file.id;

    // 2. Initialize Headers
    await initializeSpreadsheetHeaders(accessToken, spreadsheetId);

    return spreadsheetId;
  } catch (error) {
    console.error('Lỗi tạo Google Sheets:', error);
    throw error;
  }
}

/**
 * Initializes the header row of the spreadsheet.
 */
async function initializeSpreadsheetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const range = 'Sheet1!A1:H1';
  const headers = [
    'Họ',
    'Tên',
    'Danh xưng',
    'Số điện thoại',
    'Email',
    'Muốn nói chuyện với Huy?',
    'Ghi chú',
    'Thời gian gửi (UTC)'
  ];

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Không thể khởi tạo tiêu đề bảng tính');
    }
  } catch (error) {
    console.error('Lỗi khởi tạo hàng tiêu đề:', error);
    throw error;
  }
}

/**
 * Appends contact rows to the Google Sheet.
 */
export async function appendContactsToSheet(
  accessToken: string,
  spreadsheetId: string,
  contacts: SyncContact[]
): Promise<void> {
  const range = 'Sheet1!A:H';
  
  // Format data for sheet rows
  const rows = contacts.map(contact => {
    const phonesStr = contact.phones.map(p => `${p.label}: ${p.value}`).join(', ');
    const emailsStr = contact.emails.map(e => `${e.label}: ${e.value}`).join(', ');
    
    return [
      contact.firstName || '',
      contact.lastName || '',
      contact.pronouns || '',
      phonesStr,
      emailsStr,
      contact.talkToHuy ? 'Có' : 'Không',
      contact.notes || '',
      contact.createdAt ? new Date(contact.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
    ];
  });

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );

    if (!response.ok) {
      const errRes = await response.json();
      console.error('Chi tiết lỗi Google API:', errRes);
      throw new Error('Không thể thêm dữ liệu vào Google Sheet');
    }
  } catch (error) {
    console.error('Lỗi append dữ liệu:', error);
    throw error;
  }
}
