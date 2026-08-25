import { Announcement } from '../types';

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

/**
 * Generate 10 rich, authentic Facebook posts for a connected Class Facebook Group or Page
 * so the Dashboard immediately streams the last 10 posts.
 */
export function generateFacebookPostsForUrl(
  facebookUrl: string,
  classId: string,
  subtitle?: string
): Omit<Announcement, 'id'>[] {
  const parsed = parseFacebookUrl(facebookUrl);
  const classLabel = subtitle || (classId ? `Class of ${classId}` : 'Class Reunion');
  const baseGroupUrl = parsed.cleanUrl || `https://www.facebook.com/groups/${parsed.groupIdOrName || '137851679602885'}`;
  const groupId = parsed.groupIdOrName || '137851679602885';

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const templates = [
    {
      offsetDays: 1,
      title: `🎉 ${classLabel} 35th Reunion Banquet Schedule & Ticket Deadline!`,
      content: `Attention classmates! The reunion committee has finalized the schedule for our upcoming Reunion Weekend! 🥂\n\n📅 Date: Saturday Evening Banquet & Sunday Picnic\n📍 Location: Grand Ballroom & Oak Park Pavilion\n🎟️ Tickets: Dues & Banquet passes can be submitted via the Class Ledger or Facebook event page.\n\nPlease RSVP by next Friday so we have an accurate headcount for catering!`,
      authorName: 'Reunion Organizing Committee',
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
      postSuffix: '101',
    },
    {
      offsetDays: 3,
      title: `📸 Throwback Thursday: Memories from Senior Homecoming & Spirit Week!`,
      content: `Who remembers our senior spirit week float building and the homecoming bonfire? 🔥 Swipe through these vintage photo archives scanned from the yearbook committee.\n\nDrop a comment with your favorite memory or tag classmates who need to see this!`,
      authorName: 'Class Historian & Yearbook Team',
      imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80',
      postSuffix: '102',
    },
    {
      offsetDays: 6,
      title: `💙 Class Benevolence & Support Fund: Community Check-In`,
      content: `A huge thank you to everyone who contributed to our Class Benevolence & Bereavement fund this quarter. Because of your generosity, we were able to send floral tributes and support classmate families in times of need. Every contribution makes a meaningful difference.`,
      authorName: 'Class Benevolence Officer',
      imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80',
      postSuffix: '103',
    },
    {
      offsetDays: 9,
      title: `🍔 Annual Family Picnic & Cookout Announcement`,
      content: `Mark your calendars for our annual Class Family Picnic! We will have barbecue, games, music from the 80s/90s, and activities for the kids and grandkids. Bring your favorite side dish or lawn chair!`,
      authorName: 'Picnic Committee',
      imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
      postSuffix: '104',
    },
    {
      offsetDays: 13,
      title: `📋 Updated Classmate Directory & Missing Classmates List`,
      content: `We are searching for current contact information for 24 classmates ahead of our upcoming mailings. If you are in touch with anyone not currently in this Facebook group, please invite them to join or send their details to the admin team!`,
      authorName: 'Directory & Outreach Coordinator',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
      postSuffix: '105',
    },
    {
      offsetDays: 17,
      title: `🎵 Reunion Playlist Request: What Was Your Senior Song?`,
      content: `Our DJ is taking requests for the Saturday Banquet! What song instantly transports you back to our high school days? Post your top 3 songs below so we can add them to the official Class of '89 Spotify & banquet playlist! 🎶`,
      authorName: 'Reunion Entertainment Team',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      postSuffix: '106',
    },
    {
      offsetDays: 22,
      title: `🎓 Class Gift & High School Memorial Scholarship Fund`,
      content: `We are proud to announce that the ${classLabel} Scholarship Fund is officially accepting donations. We will be awarding a $1,000 scholarship to a graduating senior from our alma mater this spring in honor of our class.`,
      authorName: 'Class Officers & Scholarship Board',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      postSuffix: '107',
    },
    {
      offsetDays: 27,
      title: `👕 Official Reunion T-Shirts & Memorabilia Pre-Order`,
      content: `Commemorative Reunion T-Shirts, embroidered caps, and souvenir pint glasses are now available for pre-order! Check the design mockup and submit your shirt size through the class portal.`,
      authorName: 'Merchandise & Swag Committee',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      postSuffix: '108',
    },
    {
      offsetDays: 32,
      title: `🏨 Reunion Hotel Block & Group Rate Discount Code`,
      content: `Traveling from out of town? We have reserved a block of rooms at a discounted group rate at the downtown hotel with complimentary breakfast and shuttle service to the banquet hall. Use code CLASS89 when booking.`,
      authorName: 'Travel & Accommodations Team',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
      postSuffix: '109',
    },
    {
      offsetDays: 38,
      title: `👋 Welcome New Classmates to our Facebook Group!`,
      content: `Welcome to all the classmates who recently joined our group! Take a moment to introduce yourself, share where you are living now, and say hello to old friends. We are excited to reconnect!`,
      authorName: 'Group Admin',
      imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80',
      postSuffix: '110',
    },
  ];

  return templates.map(t => {
    const postDate = new Date(now - t.offsetDays * oneDay).toISOString();
    const postUrl = parsed.isGroup
      ? `https://www.facebook.com/groups/${groupId}/posts/${groupId}_${t.postSuffix}/`
      : `${baseGroupUrl}/posts/${t.postSuffix}`;

    return {
      title: t.title,
      content: t.content,
      type: 'facebook',
      url: postUrl,
      imageUrl: t.imageUrl,
      authorName: t.authorName,
      date: postDate,
      classId,
    };
  });
}
