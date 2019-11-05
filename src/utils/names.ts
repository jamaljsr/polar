const names: string[] = [
  'alice',
  'bob',
  'carol',
  'dave',
  'erin',
  'frank',
  'grace',
  'heidi',
  'ivan',
  'judy',
  'kathy',
  'lucy',
  'mike',
  'niaj',
  'oscar',
  'pat',
  'quincy',
  'rupert',
  'sybil',
  'trent',
  'ulyssa',
  'victor',
  'wendy',
  'xavior',
  'yuki',
  'zora',
];

export const getName = (index: number) => {
  return names[index % names.length];
};
