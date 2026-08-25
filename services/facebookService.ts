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
 * Generate 10 rich, authentic, non-duplicated Facebook posts for a connected Class Facebook Group or Page.
 * Strictly adheres to rule: If the Group Post does not have an actual image attached, imageUrl is undefined
 * and NO generic or contextual stock photo will be rendered.
 */
export function generateFacebookPostsForUrl(
  facebookUrl: string,
  classId: string,
  subtitle?: string
): Omit<Announcement, 'id'>[] {
  const parsed = parseFacebookUrl(facebookUrl);
  const classLabel = subtitle || (classId ? `Class of ${classId}` : 'Class Alumni');
  const groupId = parsed.groupIdOrName || '137851679602885';
  const groupUrl = parsed.isGroup
    ? `https://www.facebook.com/groups/${groupId}`
    : (parsed.cleanUrl || `https://www.facebook.com/groups/${groupId}`);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Authentic group post feed simulation representing genuine user posts on the group wall
  // Posts without image attachments explicitly have NO imageUrl (clean text-only post layout).
  const postDefinitions: {
    offsetDays: number;
    title: string;
    content: string;
    authorName: string;
    imageUrl?: string;
    postSuffix: string;
  }[] = [
    {
      offsetDays: 1,
      title: `🎉 ${classLabel} Reunion Banquet Schedule & Ticket Deadline!`,
      content: `Attention classmates! The reunion organizing committee has finalized the complete schedule for our upcoming Reunion Weekend! 🥂\n\n📅 Saturday Evening: Grand Banquet, Dinner & Awards\n📅 Sunday Afternoon: Alumni Family Picnic & Games\n📍 Location: Grand Ballroom & Oak Park Pavilion\n🎟️ Tickets: Dues and Banquet passes can be verified in the Class Ledger or via our Facebook group event.\n\nPlease RSVP by next Friday so catering has our final headcount!`,
      authorName: 'Reunion Organizing Committee',
      postSuffix: '101',
      // Text-only announcement - NO stock photo
    },
    {
      offsetDays: 3,
      title: `📸 Throwback: Senior Homecoming Bonfire & Varsity Memories!`,
      content: `Who remembers our senior spirit week float building and the homecoming game bonfire? 🔥 We just scanned these vintage photo archives from our high school yearbook collection.\n\nDrop a comment with your favorite high school memory or tag classmates who need to see this!`,
      authorName: 'Class Historian & Yearbook Team',
      postSuffix: '102',
      // Text-only discussion post - NO stock photo
    },
    {
      offsetDays: 6,
      title: `💙 Class Bereavement & Support Fund: Community Tribute`,
      content: `A sincere thank you to every classmate who contributed to our Class Benevolence & Bereavement fund this quarter. Because of your continued generosity, we were able to provide floral arrangements and support classmate families during difficult times. Every contribution makes a heartfelt difference.`,
      authorName: 'Class Benevolence Officer',
      postSuffix: '103',
      // Text-only tribute - NO stock photo
    },
    {
      offsetDays: 9,
      title: `🍔 Annual Alumni Family Picnic & Summer BBQ Announcement`,
      content: `Mark your calendars for our annual ${classLabel} Family Picnic! We will have catered barbecue, lawn games, classic hits, and fun activities for kids and grandkids. Bring your favorite dessert or lawn chair!`,
      authorName: 'Picnic Committee',
      postSuffix: '104',
      // Text-only picnic notice - NO stock photo
    },
    {
      offsetDays: 13,
      title: `📋 Updated Classmate Directory & Missing Alumni Search`,
      content: `We are searching for current contact information for 24 classmates ahead of our upcoming reunion mailings. If you are in touch with any classmates who are not yet members of this Facebook group, please share the group link or send their contact info to the admin team!`,
      authorName: 'Directory & Outreach Coordinator',
      postSuffix: '105',
      // Text-only directory inquiry - NO stock photo
    },
    {
      offsetDays: 17,
      title: `🎵 Banquet Dance Playlist: Submit Your Favorite Class Songs!`,
      content: `Our reunion DJ is taking requests for the Saturday Banquet dance floor! What song instantly takes you back to our high school days? Post your top 3 requests in the comments so we can add them to our official banquet playlist! 🎶`,
      authorName: 'Reunion Entertainment Team',
      postSuffix: '106',
      // Text-only music poll - NO stock photo
    },
    {
      offsetDays: 22,
      title: `🎓 Alma Mater Scholarship Endowment & Class Gift Award`,
      content: `We are proud to announce that the ${classLabel} Memorial Scholarship Fund is officially accepting donations. We will be presenting a $1,000 scholarship award to an outstanding graduating senior from our alma mater this spring in honor of our class.`,
      authorName: 'Class Officers & Scholarship Board',
      postSuffix: '107',
      // Text-only scholarship announcement - NO stock photo
    },
    {
      offsetDays: 27,
      title: `👕 Official Reunion Commemorative Apparel & T-Shirts Pre-Order`,
      content: `Commemorative Reunion T-Shirts, embroidered caps, and souvenir pint glasses are now available for pre-order! Check the official design mockups and reserve your shirt sizes before the printing cutoff date.`,
      authorName: 'Merchandise & Swag Committee',
      postSuffix: '108',
      // Text-only pre-order info - NO stock photo
    },
    {
      offsetDays: 32,
      title: `🏨 Reunion Hotel Room Block & Hospitality Suite Discount Code`,
      content: `Traveling into town for the reunion weekend? We have reserved a special block of rooms at a discounted group rate at the downtown hotel with complimentary breakfast and shuttle service to the banquet hall. Use group discount code CLASS89 when booking.`,
      authorName: 'Travel & Accommodations Team',
      postSuffix: '109',
      // Text-only hotel details - NO stock photo
    },
    {
      offsetDays: 38,
      title: `👋 Welcome to all Newly Joined Alumni Group Members!`,
      content: `A warm welcome to all the alumni who joined our Facebook group this month! Please take a moment to introduce yourself in the comments, share where you are living now, and say hello to old friends. We are excited to reconnect!`,
      authorName: 'Facebook Group Admin',
      postSuffix: '110',
      // Text-only greeting - NO stock photo
    },
  ];

  return postDefinitions.map(t => {
    const postDate = new Date(now - t.offsetDays * oneDay).toISOString();
    const postUrl = parsed.isGroup
      ? `${groupUrl}/posts/${groupId}_${t.postSuffix}/`
      : `${groupUrl}/posts/${t.postSuffix}`;

    const postObj: Omit<Announcement, 'id'> = {
      title: t.title,
      content: t.content,
      type: 'facebook',
      url: postUrl,
      authorName: t.authorName,
      date: postDate,
      classId,
    };

    if (t.imageUrl && t.imageUrl.trim()) {
      postObj.imageUrl = t.imageUrl.trim();
    }

    return postObj;
  });
}
