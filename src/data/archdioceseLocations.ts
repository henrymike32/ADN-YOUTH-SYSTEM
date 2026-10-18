export const NYERI_DEANERIES_LIST = [
  'Nyeri Central',
  'Tetu',
  'Mukurweini',
  'Karatina',
  'Othaya',
  'Gatarakwa',
  'Narumoru',
  'Nanyuki',
] as const;

export type NyeriDeaneryName = typeof NYERI_DEANERIES_LIST[number];

export const DEANERY_PARISHES_MAP: Record<string, string[]> = {
  'Tetu': [
    'Tetu',
    'Kigogoini',
    'Kamakwa',
    'Giakanja',
    'Wamagana',
    'Ithenguri',
    'Gititu',
    'Kangaita',
    'Karangia',
  ],
  'Othaya': [
    'Othaya',
    'Birithia',
    'Witima',
    'Karima',
    'Kigumo',
    'Kagicha',
    'Kariko',
    'Karuthi',
  ],
  'Mukurweini': [
    'Mukurweini',
    'Gikondi',
    'Kimondo',
    'Kaheti',
    'Giathugu',
  ],
  'Nyeri Central': [
    'Cathedral',
    'St. Jude',
    'Ngangarithi',
    'Kingongo',
    'Kiamuiru',
    'Mwenji',
  ],
  'Karatina': [
    'Karatina',
    'Giakaimbei',
    'Gikumbo',
    'Kabiruini',
    'Kamatu',
    'Kahiraini',
    'Ngandu',
    'Gathugu',
    'Miiri',
  ],
  'Nanyuki': [
    'Christ the King',
    'Doldol',
    'Matanya',
    'St. Teresa Equator',
    'Kalalu',
  ],
  'Narumoru': [
    'Irigithathi',
    'Thegu',
    'Munyu',
    'Chaka',
    'Narumoru Town',
  ],
  'Gatarakwa': [
    'Sirma',
    'Mugunda',
    'Mweiga',
    'Endarasha',
    'Gatarakwa',
    'Kamariki',
    'Karemeno',
    'Wiyumiririe',
  ],
};

export const CHALLENGE_WEEK_PAYMENT_CONFIG = {
  feePerPerson: 1000,
  paybill: '400200', // Co-operative Bank
  accountNumber: '01100032725500',
  accountName: 'ADN YOUTH OFFICE',
  bankName: 'Co-operative Bank of Kenya',
};
