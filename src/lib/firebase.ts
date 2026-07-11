import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Workspace scopes for sheets and drive
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check for redirect result when auth is initialized
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          localStorage.setItem('cached_access_token', credential.accessToken);
          if (onAuthSuccess && result.user) {
            onAuthSuccess(result.user, credential.accessToken);
          }
        }
      }
    })
    .catch((error) => {
      console.error('Error with redirect result:', error);
    });

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const storedToken = cachedAccessToken || localStorage.getItem('cached_access_token');
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('cached_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google: Try Popup first, fallback to Redirect if popup is blocked
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    localStorage.setItem('is_admin_open_pending', 'true');
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được Access Token từ Google Sign-In. Hãy thử lại.');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('cached_access_token', credential.accessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Lỗi đăng nhập qua Popup, thử chuyển hướng (Redirect)...', error);
    if (
      error.code === 'auth/popup-blocked' ||
      error.message?.includes('popup-blocked') ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      // Trigger Redirect sign-in
      await signInWithRedirect(auth, provider);
      return null; // Page will redirect
    }
    localStorage.removeItem('is_admin_open_pending');
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem('cached_access_token');
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('cached_access_token');
  localStorage.removeItem('is_admin_open_pending');
};
