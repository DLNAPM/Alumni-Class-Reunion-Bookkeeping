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
