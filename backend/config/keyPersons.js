// Canonical "List of key persons (ITV)" directory.
//
// Source: the printed contact sheet on the office notice board (Section/Department,
// Full Name, Mobile, PABX) plus its two side tables — bureau mobile numbers and the
// shared/common PABX lines.
//
// Like backend/config/defaultServers.js this list is config driven on purpose: the
// Extensions page must show the real office lines even on a fresh install where
// MongoDB still holds no rows. `scripts/syncExtensions.js` (npm run seed:extensions)
// copies the same list into the `extensions` collection so the asset register, the
// dashboard "Total Extensions" count and the page never disagree.
//
// `pabx` is always an array. A person can hold two lines (Md. Rakibul Hasan is on
// 30109 and 30133) and the reception desk answers on three numbers; the first entry
// is the primary line.

export const KEY_PERSON_SECTIONS = [
  {
    section: 'News',
    people: [
      { name: 'Shamin Abdullah Zahedy', mobile: '01755533707', pabx: ['30101'] },
      { name: 'Mamun Abdullah', mobile: '01755515231', pabx: ['30104'] },
      { name: 'Monira Akmal', mobile: '01730701385', pabx: ['30161'] },
      { name: 'Md. Abdulla Al Rafi', mobile: '01755515247', pabx: ['30103'] },
    ],
  },
  {
    section: 'News Section In Charge',
    people: [
      { name: 'Md. Nazrul Islam Tomal', mobile: '01755515227', pabx: ['30148'] },
      { name: 'Md. Rakibul Hasan', mobile: '01755533698', pabx: ['30109', '30133'] },
      { name: 'Mohammed Anwar Suli', mobile: '01755537371', pabx: ['30163'] },
      { name: 'Nusrat Zeen', mobile: '0175553729', pabx: ['30127'] },
      { name: 'Umman Nahar Anmee', mobile: '01755515257', pabx: ['30157'] },
    ],
  },
  {
    section: 'Broadcast Operations',
    people: [
      { name: 'Shamin Abdullah Zahedy', mobile: '01755533707', pabx: ['30101'] },
      { name: 'Nayla Pervin Peya', mobile: '01730701317', pabx: ['30170'] },
      { name: 'Emran Ul Anowar', mobile: '017307344026', pabx: ['30175'] },
    ],
  },
  {
    section: 'Broadcast Operations Section In Charge',
    people: [
      { name: 'Mahboob Rashad Ashraf Ulal', mobile: '01730701328', pabx: ['30260'] },
      { name: 'Sheikh Humayun Ashar', mobile: '01730701372', pabx: ['30115'] },
      { name: 'Tanmoy Almas', mobile: '01730701322', pabx: ['30278'] },
      { name: 'Tushar Suvo Das', mobile: '01730701350', pabx: ['30262'] },
    ],
  },
  {
    section: 'Broadcast IT',
    people: [{ name: 'Apu Roy', mobile: '01730701382', pabx: ['30351'] }],
  },
  {
    section: 'Broadcast Technology',
    people: [{ name: 'Md. Shahidul Hoque', mobile: '01755515254', pabx: ['30366'] }],
  },
  {
    section: 'Finance and Accounts',
    people: [
      { name: 'Md. Shajjad Hossain', mobile: '01714170014', pabx: ['30480'] },
      { name: 'Sumon Kumar Ghosh', mobile: '01755515248', pabx: ['30481'] },
    ],
  },
  {
    section: 'Human Resources',
    people: [
      { name: 'Mahbubur Rahman', mobile: '01755533597', pabx: ['30460'] },
      { name: 'Parvej Ghosh', mobile: '01730701341', pabx: ['30462'] },
    ],
  },
  {
    section: 'Sales & Marketing',
    people: [{ name: 'Shabab Karim', mobile: '01730701400', pabx: ['30560'] }],
  },
  {
    section: 'Support Services',
    people: [
      { name: 'Muhammad Shafiqul Alam', mobile: '01755533577', pabx: ['30410'] },
      { name: 'Md. Afzal Hossain Khan', mobile: '01730444025', pabx: ['30411'] },
      { name: 'Younus Ali', mobile: '01730444024', pabx: ['30417'] },
    ],
  },
  {
    section: 'Digital Media',
    people: [
      { name: 'Selim Khan', mobile: '01755533583', pabx: ['30705'] },
      { name: 'Md Fazlul Kabir', mobile: '01755533584', pabx: ['30706'] },
    ],
  },
];

// Bureau correspondents. The notice board only lists mobile numbers for them.
export const BUREAU_CONTACTS = [
  { name: 'Maruf Ahmed (Barisal)', mobile: '01755537381' },
  { name: 'Md. Hasibur Rahman Biju (Bogra)', mobile: '01755537383' },
  { name: 'Mohammed Alarnge (CTG)', mobile: '01329694736' },
  { name: 'A.H.M. Shamimuzzaman (Khulna)', mobile: '01755537384' },
  { name: 'Monjur Ahmed (Sylhet)', mobile: '01755537370' },
  { name: 'Md. Monsur Rahman (Rajshahi)', mobile: '01755537378' },
];

// Shared PABX lines (facilities rather than desks).
export const COMMON_PABX = [
  { name: 'Reception', pabx: ['0', '30444', '30445'] },
  { name: 'PS to CEO', pabx: ['30201'] },
  { name: 'Co-Ordination (News Room)', pabx: ['30164'] },
  { name: 'Cafeteria - 5th Floor', pabx: ['30430'] },
  { name: 'Cafeteria - 10th Floor', pabx: ['30333'] },
  { name: 'Security Entrance Gate', pabx: ['30064'] },
  { name: 'Building Automation / PABX', pabx: ['30021'] },
];

// Flattened person list, handy for the API response and for seeding.
export const KEY_PEOPLE = KEY_PERSON_SECTIONS.flatMap(({ section, people }) =>
  people.map((person) => ({ ...person, section }))
);

// One row per distinct PABX number. People sharing a line (30101 is listed for both
// News and Broadcast Operations) are merged into `holders`, which keeps the MongoDB
// `extensionNumber` unique index happy while still showing every name in the UI.
const buildPabxLines = () => {
  const lines = new Map();

  const upsert = (extensionNumber, { holders, mobile, section, kind }) => {
    const existing = lines.get(extensionNumber);
    if (existing) {
      holders.forEach((holder) => {
        if (!existing.holders.includes(holder)) existing.holders.push(holder);
      });
      if (!existing.sections.includes(section)) existing.sections.push(section);
      if (!existing.mobile && mobile) existing.mobile = mobile;
      return;
    }
    lines.set(extensionNumber, {
      extensionNumber,
      holders: [...holders],
      sections: [section],
      mobile: mobile || null,
      kind,
    });
  };

  KEY_PEOPLE.forEach((person) => {
    person.pabx.forEach((extensionNumber) => {
      upsert(extensionNumber, {
        holders: [person.name],
        mobile: person.mobile,
        section: person.section,
        kind: 'Person',
      });
    });
  });

  COMMON_PABX.forEach((line) => {
    line.pabx.forEach((extensionNumber) => {
      upsert(extensionNumber, { holders: [line.name], section: 'Common', kind: 'Common' });
    });
  });

  return [...lines.values()].sort((a, b) =>
    a.extensionNumber.localeCompare(b.extensionNumber, undefined, { numeric: true })
  );
};

export const PABX_LINES = buildPabxLines();

export const DIRECTORY_SUMMARY = {
  keyPersons: KEY_PEOPLE.length,
  sections: KEY_PERSON_SECTIONS.length,
  bureauContacts: BUREAU_CONTACTS.length,
  commonLines: COMMON_PABX.length,
  personLines: PABX_LINES.filter((line) => line.kind === 'Person').length,
  sharedLines: PABX_LINES.filter((line) => line.kind === 'Common').length,
  pabxLines: PABX_LINES.length,
};

export default KEY_PERSON_SECTIONS;
