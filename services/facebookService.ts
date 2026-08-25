import { auth, facebookProvider } from '../firebase';
import type { Announcement } from '../types';

export interface ParsedFacebookInfo {
  isGroup: boolean;
  isPage: boolean;
  groupIdOrName: string;
  cleanUrl: string;
  embedType: 'group' | 'page' | 'post' | 'unknown';
}

export function parseFacebookUrl(rawUrl: string): ParsedFacebookInfo {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isGroup: false,
      isPage: false,
      groupIdOrName: '',
      cleanUrl: '',
      embedType: 'unknown',
    };
  }

  const url = rawUrl.trim();
  const isGroup = url.includes('/groups/');
  const isPost = url.includes('/posts/') || url.includes('/permalink/') || url.includes('story.php');
  const isPage = !isGroup && !isPost && (url.includes('facebook.com/') || url.includes('fb.com/'));

  let groupIdOrName = '';
  if (isGroup) {
    const match = url.match(/\/groups\/([^/?#]+)/);
    if (match && match[1]) {
      groupIdOrName = match[1];
    }
  } else if (isPage) {
    const match = url.match(/facebook\.com\/([^/?#]+)/);
    if (match && match[1] && match[1] !== 'pages' && match[1] !== 'profile.php') {
      groupIdOrName = match[1];
    }
  }

  return {
    isGroup,
    isPage,
    groupIdOrName,
    cleanUrl: url,
    embedType: isGroup ? 'group' : isPost ? 'post' : isPage ? 'page' : 'unknown',
  };
}

export interface FacebookAuthResult {
  accessToken: string;
  userName?: string | null;
  userEmail?: string | null;
  userId?: string | null;
}

const FB_TOKEN_STORAGE_KEY = 'fb_admin_oauth_access_token';
const FB_USER_INFO_KEY = 'fb_admin_user_info';

export function getStoredFacebookToken(): string | null {
  try {
    return sessionStorage.getItem(FB_TOKEN_STORAGE_KEY) || localStorage.getItem(FB_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredFacebookToken(token: string, userName?: string): void {
  try {
    if (token) {
      sessionStorage.setItem(FB_TOKEN_STORAGE_KEY, token);
      localStorage.setItem(FB_TOKEN_STORAGE_KEY, token);
      if (userName) {
        sessionStorage.setItem(FB_USER_INFO_KEY, userName);
        localStorage.setItem(FB_USER_INFO_KEY, userName);
      }
    } else {
      clearStoredFacebookToken();
    }
  } catch (e) {
    console.warn("Could not save FB token to storage:", e);
  }
}

export function clearStoredFacebookToken(): void {
  try {
    sessionStorage.removeItem(FB_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(FB_USER_INFO_KEY);
    localStorage.removeItem(FB_TOKEN_STORAGE_KEY);
    localStorage.removeItem(FB_USER_INFO_KEY);
  } catch (e) {
    console.warn("Could not clear FB token:", e);
  }
}

export function getStoredFacebookUserName(): string | null {
  try {
    return sessionStorage.getItem(FB_USER_INFO_KEY) || localStorage.getItem(FB_USER_INFO_KEY);
  } catch {
    return null;
  }
}

/**
 * Initiates Facebook OAuth Login popup via Firebase Auth and retrieves the Access Token
 */
export async function loginAdminWithFacebook(): Promise<FacebookAuthResult> {
  try {
    const result = await auth.signInWithPopup(facebookProvider);
    const credential = result.credential as any;
    const token = credential?.accessToken;

    if (!token) {
      throw new Error("Facebook login completed, but no OAuth Access Token was returned. Please verify app permissions.");
    }

    const userName = result.user?.displayName || 'Facebook Admin';
    const userEmail = result.user?.email || null;
    const userId = result.user?.uid || null;

    setStoredFacebookToken(token, userName);

    return {
      accessToken: token,
      userName,
      userEmail,
      userId
    };
  } catch (error: any) {
    console.error("Facebook Login Error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Facebook login popup was closed before completing.");
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error("Facebook login request was cancelled.");
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("An account already exists with the same email. Please sign in with your primary credential.");
    }
    throw new Error(error.message || "Failed to log in with Facebook.");
  }
}

export interface GraphPostItem {
  id: string;
  message?: string;
  story?: string;
  created_time?: string;
  full_picture?: string;
  permalink_url?: string;
  from?: {
    name?: string;
    id?: string;
  };
  attachments?: {
    data?: Array<{
      media?: {
        image?: {
          src?: string;
        };
      };
      type?: string;
      url?: string;
      title?: string;
      description?: string;
    }>;
  };
}

/**
 * Fetches the 10 most recent posts directly from Facebook Graph API
 */
export async function fetchFacebookPostsFromGraph(
  facebookUrl: string,
  accessToken: string,
  classId: string
): Promise<Omit<Announcement, 'id'>[]> {
  const parsed = parseFacebookUrl(facebookUrl);
  const targetId = parsed.groupIdOrName || facebookUrl.replace(/https?:\/\/(www\.)?facebook\.com\//, '').replace(/\/$/, '');

  if (!targetId) {
    throw new Error("Invalid Facebook Page or Group URL. Please enter a valid URL in Admin Settings.");
  }

  if (!accessToken || !accessToken.trim()) {
    throw new Error("Admin must be logged into Facebook to fetch posts. Please click 'Log in with Facebook'.");
  }

  const fields = 'id,message,story,created_time,full_picture,permalink_url,from,attachments{media,type,url,title,description}';
  const url1 = `https://graph.facebook.com/v19.0/${encodeURIComponent(targetId)}/feed?fields=${encodeURIComponent(fields)}&limit=10&access_token=${encodeURIComponent(accessToken.trim())}`;
  
  let response = await fetch(url1);
  let data = await response.json();

  // If /feed fails with page-related error, try /posts endpoint
  if (!response.ok || data.error) {
    if (data.error && data.error.code === 100) {
      const url2 = `https://graph.facebook.com/v19.0/${encodeURIComponent(targetId)}/posts?fields=${encodeURIComponent(fields)}&limit=10&access_token=${encodeURIComponent(accessToken.trim())}`;
      const resp2 = await fetch(url2);
      const data2 = await resp2.json();
      if (resp2.ok && !data2.error) {
        response = resp2;
        data = data2;
      }
    }
  }

  if (!response.ok || data.error) {
    const errMsg = data?.error?.message || `HTTP ${response.status}: Failed to fetch posts from Facebook Graph API.`;
    console.error("Facebook Graph API error response:", data);
    throw new Error(errMsg);
  }

  const rawPosts: GraphPostItem[] = data.data || [];
  if (!Array.isArray(rawPosts) || rawPosts.length === 0) {
    return [];
  }

  const announcements: Omit<Announcement, 'id'>[] = rawPosts.slice(0, 10).map((item, index) => {
    const rawContent = (item.message || item.story || '').trim();
    
    // Extract genuine title from message or fallback
    let title = '';
    if (rawContent) {
      const firstLine = rawContent.split('\n')[0].trim();
      title = firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
    }
    if (!title) {
      title = `Facebook Post #${index + 1}`;
    }

    // High resolution picture or attachment picture
    const pictureUrl = item.full_picture || item.attachments?.data?.[0]?.media?.image?.src || undefined;
    
    // Direct permalink to Facebook post
    const postUrl = item.permalink_url || (parsed.isGroup 
      ? `https://www.facebook.com/groups/${parsed.groupIdOrName}/permalink/${item.id.split('_')[1] || item.id}/` 
      : `https://www.facebook.com/${item.id}`);

    const author = item.from?.name || (parsed.isGroup ? `Facebook Group Member` : 'Class Page');

    return {
      classId,
      title,
      content: rawContent,
      date: item.created_time || new Date().toISOString(),
      type: 'facebook',
      url: postUrl,
      imageUrl: pictureUrl,
      authorName: author
    };
  });

  return announcements;
}
