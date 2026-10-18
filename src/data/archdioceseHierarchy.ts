export interface DeaneryParishData {
  deanery: string;
  parishes: string[];
}

export const ARCHDIOCESE_DEANERIES_AND_PARISHES: DeaneryParishData[] = [
  {
    deanery: 'Nyeri Central',
    parishes: [
      'Cathedral',
      'St Jude',
      'Ngangarithi',
      'Kingongo',
      'Kiamuiru',
      'Mwenji',
    ],
  },
  {
    deanery: 'Tetu',
    parishes: [
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
  },
  {
    deanery: 'Mukurweini',
    parishes: [
      'Mukurweini',
      'Gikondi',
      'Kimondo',
      'Kaheti',
      'Giathugu',
    ],
  },
  {
    deanery: 'Karatina',
    parishes: [
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
  },
  {
    deanery: 'Othaya',
    parishes: [
      'Othaya',
      'Birithia',
      'Witima',
      'Karima',
      'Kigumo',
      'Kagicha',
      'Kariko',
      'Karuthi',
    ],
  },
  {
    deanery: 'Gatarakwa',
    parishes: [
      'Sirma',
      'Mugunda',
      'Mweiga',
      'Endarasha',
      'Gatarakwa',
      'Kamariki',
      'Karemeno',
      'Wiyumiririe',
    ],
  },
  {
    deanery: 'Narumoru',
    parishes: [
      'Irigithathi',
      'Thegu',
      'Munyu',
      'Chaka',
      'Narumoru Town',
    ],
  },
  {
    deanery: 'Nanyuki',
    parishes: [
      'Christ the King',
      'Doldol',
      'Matanya',
      'St Teresa Equator',
      'Kalalu',
    ],
  },
];

export const PAYMENT_COOPERATIVE_BANK = {
  paybill: '400200',
  accountNumber: '01100032725500',
  accountName: 'ADN YOUTH OFFICE',
  feePerPerson: 1000,
  currency: 'Ksh',
};
