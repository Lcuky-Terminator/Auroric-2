import { User, Pin, Board, Notification } from './types';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1555195313933-4195215c31f7?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1504674900152-b8b2edc10b1b?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1578321126119-cec7a973d2d0?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1577720613305-d09e98e4ef9e?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1586023566828-5d98ede24ded?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1565183938294-7563f3ff68c7?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1490481651236-d98b6dca7a40?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=700&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop',
];

export function generateSeedData() {
  const users: User[] = [
    {
      id: 'user-current',
      username: 'alexdesigner',
      displayName: 'Alex Designer',
      email: 'alex@auroric.com',
      bio: 'Visual Designer & Creative Director. Passionate about luxury design, minimalism, and curating beautiful inspiration.',
      avatar: '',
      website: 'https://alexdesigner.com',
      followers: ['user-2', 'user-3', 'user-4', 'user-5'],
      following: ['user-2', 'user-3'],
      createdAt: '2025-06-15T10:00:00Z',
      emailVerified: true,
      isVerified: false,
      verificationType: 'none',
      isPromoted: false,
      passwordChangeCount: 0,
      accountStatus: 'active',
      settings: {
        privateProfile: false,
        showActivity: true,
        allowMessages: true,
        allowNotifications: true,
        emailOnNewFollower: true,
        emailOnPinInteraction: true,
        theme: 'dark',
      },
    },
    {
      id: 'user-2',
      username: 'sarahcreative',
      displayName: 'Sarah Creative',
      email: 'sarah@example.com',
      bio: 'Interior designer and home decor enthusiast. Creating beautiful spaces one room at a time.',
      avatar: '',
      website: 'https://sarahcreative.com',
      followers: ['user-current', 'user-3', 'user-4'],
      following: ['user-current', 'user-3', 'user-5'],
      createdAt: '2025-07-20T14:30:00Z',
      emailVerified: true,
      isVerified: false,
      verificationType: 'none',
      isPromoted: false,
      passwordChangeCount: 0,
      accountStatus: 'active',
      settings: { privateProfile: false, showActivity: true, allowMessages: true, allowNotifications: true, emailOnNewFollower: true, emailOnPinInteraction: true, theme: 'dark' },
    },
    {
      id: 'user-3',
      username: 'marcostyle',
      displayName: 'Marco Style',
      email: 'marco@example.com',
      bio: 'Fashion photographer and style curator. See the world through a luxury lens.',
      avatar: '',
      website: '',
      followers: ['user-current', 'user-2', 'user-5'],
      following: ['user-current', 'user-2', 'user-4'],
      createdAt: '2025-08-10T09:15:00Z',
      emailVerified: true,
      isVerified: false,
      verificationType: 'none',
      isPromoted: false,
      passwordChangeCount: 0,
      accountStatus: 'active',
      settings: { privateProfile: false, showActivity: true, allowMessages: true, allowNotifications: true, emailOnNewFollower: true, emailOnPinInteraction: true, theme: 'dark' },
    },
    {
      id: 'user-4',
      username: 'emmaarchitect',
      displayName: 'Emma Architect',
      email: 'emma@example.com',
      bio: 'Architectural designer specializing in contemporary urban spaces.',
      avatar: '',
      website: 'https://emmaarchitect.com',
      followers: ['user-3'],
      following: ['user-current', 'user-2'],
      createdAt: '2025-09-05T16:45:00Z',
      emailVerified: true,
      isVerified: false,
      verificationType: 'none',
      isPromoted: false,
      passwordChangeCount: 0,
      accountStatus: 'active',
      settings: { privateProfile: false, showActivity: true, allowMessages: true, allowNotifications: true, emailOnNewFollower: true, emailOnPinInteraction: true, theme: 'dark' },
    },
    {
      id: 'user-5',
      username: 'liatravel',
      displayName: 'Lia Travel',
      email: 'lia@example.com',
      bio: 'Travel blogger and adventure photographer. Sharing the beauty of the world.',
      avatar: '',
      website: 'https://liatravel.blog',
      followers: ['user-2'],
      following: ['user-current', 'user-3'],
      createdAt: '2025-10-01T11:20:00Z',
      emailVerified: true,
      isVerified: false,
      verificationType: 'none',
      isPromoted: false,
      passwordChangeCount: 0,
      accountStatus: 'active',
      settings: { privateProfile: false, showActivity: true, allowMessages: true, allowNotifications: true, emailOnNewFollower: true, emailOnPinInteraction: true, theme: 'dark' },
    },
  ];

  const boards: Board[] = [
    {
      id: 'board-1',
      name: 'Interior Design Inspiration',
      description: 'Modern and minimalist interior design ideas for every room',
      coverImage: SAMPLE_IMAGES[0],
      ownerId: 'user-current',
      pins: ['pin-1', 'pin-10', 'pin-11'],
      followers: ['user-2', 'user-3'],
      collaborators: [],
      isPrivate: false,
      category: 'Interior Design',
      createdAt: '2025-07-01T10:00:00Z',
      updatedAt: '2025-12-01T10:00:00Z',
    },
    {
      id: 'board-2',
      name: 'Luxury Fashion Trends',
      description: 'Premium fashion and accessories inspiration',
      coverImage: SAMPLE_IMAGES[2],
      ownerId: 'user-current',
      pins: ['pin-3', 'pin-12'],
      followers: ['user-2', 'user-4', 'user-5'],
      collaborators: ['user-2'],
      isPrivate: false,
      category: 'Fashion',
      createdAt: '2025-07-15T14:30:00Z',
      updatedAt: '2025-11-20T14:30:00Z',
    },
    {
      id: 'board-3',
      name: 'Personal Style Guide',
      description: 'My curated collection of outfits and style ideas',
      coverImage: SAMPLE_IMAGES[15],
      ownerId: 'user-current',
      pins: ['pin-6'],
      followers: [],
      collaborators: [],
      isPrivate: true,
      category: 'Fashion',
      createdAt: '2025-08-01T09:00:00Z',
      updatedAt: '2025-10-15T09:00:00Z',
    },
    {
      id: 'board-4',
      name: 'Architecture & Urban Design',
      description: 'Contemporary and classical architecture inspiration',
      coverImage: SAMPLE_IMAGES[4],
      ownerId: 'user-4',
      pins: ['pin-5', 'pin-13'],
      followers: ['user-current', 'user-2', 'user-3'],
      collaborators: ['user-current'],
      isPrivate: false,
      category: 'Architecture',
      createdAt: '2025-09-10T16:45:00Z',
      updatedAt: '2025-12-05T16:45:00Z',
    },
    {
      id: 'board-5',
      name: 'Culinary Adventures',
      description: 'Gourmet food, beautiful plating, and kitchen inspiration',
      coverImage: SAMPLE_IMAGES[7],
      ownerId: 'user-2',
      pins: ['pin-8', 'pin-14'],
      followers: ['user-current', 'user-5'],
      collaborators: [],
      isPrivate: false,
      category: 'Food & Beverage',
      createdAt: '2025-08-20T11:00:00Z',
      updatedAt: '2025-11-10T11:00:00Z',
    },
    {
      id: 'board-6',
      name: 'Travel Destinations',
      description: 'Dream destinations and travel inspiration from around the world',
      coverImage: SAMPLE_IMAGES[16],
      ownerId: 'user-5',
      pins: ['pin-7', 'pin-15'],
      followers: ['user-current', 'user-2', 'user-3', 'user-4'],
      collaborators: ['user-3'],
      isPrivate: false,
      category: 'Travel',
      createdAt: '2025-10-05T13:30:00Z',
      updatedAt: '2025-12-08T13:30:00Z',
    },
    {
      id: 'board-7',
      name: 'Art & Creativity',
      description: 'Abstract art, installations, and creative expression',
      coverImage: SAMPLE_IMAGES[8],
      ownerId: 'user-3',
      pins: ['pin-9', 'pin-16'],
      followers: ['user-current', 'user-4'],
      collaborators: [],
      isPrivate: false,
      category: 'Art',
      createdAt: '2025-09-25T15:00:00Z',
      updatedAt: '2025-11-30T15:00:00Z',
    },
  ];

  const pinData = [
    { title: 'Modern Minimalist Interior Design', desc: 'Contemporary living room with elegant furniture and natural lighting. Perfect for creating serene, beautiful spaces.', cat: 'Interior Design', tags: ['interior', 'minimalism', 'modern', 'home decor'], author: 'user-current' },
    { title: 'Luxury Gold & Purple Aesthetic', desc: 'Rich color palette perfect for premium branding and visual identity.', cat: 'Art', tags: ['color', 'aesthetic', 'branding', 'luxury'], author: 'user-3' },
    { title: 'Contemporary Fashion Editorial', desc: 'Latest trends in luxury fashion photography and editorial styling.', cat: 'Fashion', tags: ['fashion', 'editorial', 'photography', 'luxury'], author: 'user-current' },
    { title: 'Elegant Table Setting Ideas', desc: 'Premium tablescape inspiration for special events and celebrations.', cat: 'Food & Beverage', tags: ['events', 'table setting', 'elegant', 'dining'], author: 'user-2' },
    { title: 'Urban Architecture & Design', desc: 'Modern building facades and urban planning inspiration from around the world.', cat: 'Architecture', tags: ['architecture', 'urban', 'modern', 'design'], author: 'user-4' },
    { title: 'Premium Watch Collection', desc: 'Luxury timepieces and accessories for the discerning collector.', cat: 'Fashion', tags: ['watches', 'luxury', 'accessories', 'style'], author: 'user-current' },
    { title: 'Botanical Garden Photography', desc: 'Beautiful botanical gardens and natural landscapes captured in stunning detail.', cat: 'Nature', tags: ['nature', 'botanical', 'photography', 'gardens'], author: 'user-5' },
    { title: 'Gourmet Culinary Experience', desc: 'Fine dining presentations and gourmet food photography.', cat: 'Food & Beverage', tags: ['food', 'gourmet', 'culinary', 'dining'], author: 'user-2' },
    { title: 'Abstract Art Installation', desc: 'Contemporary abstract art installations and gallery exhibitions.', cat: 'Art', tags: ['art', 'abstract', 'installation', 'gallery'], author: 'user-3' },
    { title: 'Scandinavian Design Inspiration', desc: 'Clean lines, natural materials, and functional beauty of Scandinavian design.', cat: 'Interior Design', tags: ['scandinavian', 'interior', 'minimalism', 'nordic'], author: 'user-2' },
    { title: 'Cozy Reading Nooks', desc: 'Perfect spots for curling up with a good book. Warm lighting and comfortable seating.', cat: 'Interior Design', tags: ['reading', 'cozy', 'home', 'interior'], author: 'user-current' },
    { title: 'Street Style Photography', desc: 'Capturing the best of urban fashion and street style around the globe.', cat: 'Fashion', tags: ['street style', 'fashion', 'urban', 'photography'], author: 'user-3' },
    { title: 'Glass & Steel Architecture', desc: 'Contemporary buildings featuring innovative use of glass and steel.', cat: 'Architecture', tags: ['architecture', 'glass', 'steel', 'modern'], author: 'user-4' },
    { title: 'Artisan Coffee Culture', desc: 'The art of specialty coffee from bean to cup.', cat: 'Food & Beverage', tags: ['coffee', 'artisan', 'cafe', 'culture'], author: 'user-2' },
    { title: 'Mountain Trek Adventures', desc: 'Epic mountain landscapes and trekking routes for the adventurous spirit.', cat: 'Travel', tags: ['mountains', 'trekking', 'adventure', 'travel'], author: 'user-5' },
    { title: 'Digital Art Gallery', desc: 'Modern digital art pieces pushing the boundaries of creative expression.', cat: 'Art', tags: ['digital art', 'creative', 'modern', 'gallery'], author: 'user-3' },
    { title: 'Minimalist Bedroom Ideas', desc: 'Clean and serene bedroom designs for better rest and relaxation.', cat: 'Interior Design', tags: ['bedroom', 'minimalism', 'interior', 'peaceful'], author: 'user-current' },
    { title: 'Luxury Home Office Design', desc: 'Productive and stylish home office setups for the modern professional.', cat: 'Interior Design', tags: ['office', 'home', 'productivity', 'design'], author: 'user-2' },
    { title: 'Vintage Fashion Revival', desc: 'Timeless vintage fashion pieces making a comeback in modern wardrobes.', cat: 'Fashion', tags: ['vintage', 'fashion', 'retro', 'style'], author: 'user-3' },
    { title: 'Coastal Travel Destinations', desc: 'Breathtaking coastal views and beach destinations around the world.', cat: 'Travel', tags: ['coastal', 'beach', 'travel', 'ocean'], author: 'user-5' },
    { title: 'Ceramic Art & Pottery', desc: 'Handcrafted ceramic pieces and pottery art from talented artisans.', cat: 'DIY & Crafts', tags: ['ceramic', 'pottery', 'handmade', 'craft'], author: 'user-4' },
    { title: 'Sunset Photography Collection', desc: 'Capturing the golden hour in its most breathtaking moments.', cat: 'Photography', tags: ['sunset', 'photography', 'golden hour', 'landscape'], author: 'user-5' },
    { title: 'Modern Kitchen Designs', desc: 'Sleek and functional kitchen layouts with premium appliances.', cat: 'Interior Design', tags: ['kitchen', 'modern', 'interior', 'design'], author: 'user-2' },
    { title: 'High Fashion Accessories', desc: 'Designer handbags, jewelry, and accessories for the style-conscious.', cat: 'Fashion', tags: ['accessories', 'designer', 'luxury', 'fashion'], author: 'user-3' },
  ];

  const pins: Pin[] = pinData.map((p, i) => ({
    id: `pin-${i + 1}`,
    title: p.title,
    description: p.desc,
    imageUrl: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length],
    authorId: p.author,
    boardId: undefined,
    tags: p.tags,
    category: p.cat,
    likes: generateRandomLikes(i),
    saves: generateRandomSaves(i),
    comments: generateComments(`pin-${i + 1}`, i),
    views: Math.floor(Math.random() * 5000) + 100,
    isPrivate: false,
    createdAt: generateDate(i),
    updatedAt: generateDate(i),
  }));

  // Assign pins to boards
  boards.forEach(board => {
    board.pins.forEach(pinId => {
      const pin = pins.find(p => p.id === pinId);
      if (pin) pin.boardId = board.id;
    });
  });

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'like',
      fromUserId: 'user-2',
      toUserId: 'user-current',
      pinId: 'pin-1',
      message: 'Sarah Creative liked your pin',
      read: false,
      createdAt: '2026-02-12T08:00:00Z',
    },
    {
      id: 'notif-2',
      type: 'follow',
      fromUserId: 'user-4',
      toUserId: 'user-current',
      message: 'Emma Architect started following you',
      read: false,
      createdAt: '2026-02-11T15:30:00Z',
    },
    {
      id: 'notif-3',
      type: 'comment',
      fromUserId: 'user-3',
      toUserId: 'user-current',
      pinId: 'pin-3',
      message: 'Marco Style commented on your pin',
      read: true,
      createdAt: '2026-02-10T12:00:00Z',
    },
    {
      id: 'notif-4',
      type: 'save',
      fromUserId: 'user-5',
      toUserId: 'user-current',
      pinId: 'pin-1',
      message: 'Lia Travel saved your pin',
      read: true,
      createdAt: '2026-02-09T09:00:00Z',
    },
  ];

  return { users, pins, boards, notifications };
}

function generateRandomLikes(seed: number): string[] {
  const userIds = ['user-current', 'user-2', 'user-3', 'user-4', 'user-5'];
  const count = (seed * 3 + 1) % 5;
  return userIds.slice(0, count + 1);
}

function generateRandomSaves(seed: number): string[] {
  const userIds = ['user-current', 'user-2', 'user-3', 'user-4', 'user-5'];
  const count = (seed * 2) % 4;
  return userIds.slice(0, count);
}

function generateComments(pinId: string, seed: number): import('./types').Comment[] {
  const comments: import('./types').Comment[] = [];
  const sampleComments = [
    'This is absolutely stunning! Love the aesthetic.',
    'Great inspiration, saving this for later!',
    'The composition here is incredible.',
    'Just what I was looking for! Thank you for sharing.',
    'Beautiful work, the attention to detail is impressive.',
  ];
  const authors = ['user-2', 'user-3', 'user-4', 'user-5'];
  const count = (seed % 3) + 1;

  for (let i = 0; i < count; i++) {
    comments.push({
      id: `comment-${pinId}-${i + 1}`,
      text: sampleComments[(seed + i) % sampleComments.length],
      authorId: authors[(seed + i) % authors.length],
      pinId,
      likes: [],
      createdAt: generateDate(seed + i + 10),
    });
  }
  return comments;
}

function generateDate(offset: number): string {
  const date = new Date('2026-02-12T00:00:00Z');
  date.setDate(date.getDate() - (offset * 3 + 1));
  return date.toISOString();
}
