export class DAY_MAPPING {
  meridian: string;
  'unit-id': string;
  'unit-name': string;
  action: Array<string>;
}

export class WEEK_MAPPING {
  Monday: Array<DAY_MAPPING>;
  Tuesday: Array<DAY_MAPPING>;
  Wednesday: Array<DAY_MAPPING>;
  Thursday: Array<DAY_MAPPING>;
  Friday: Array<DAY_MAPPING>;
  Saturday: Array<DAY_MAPPING>;
  Sunday: Array<DAY_MAPPING>;
}

export class MAPPING {
  'week-1': WEEK_MAPPING;
  'week-2': WEEK_MAPPING;
  'week-3': WEEK_MAPPING;
  'week-4': WEEK_MAPPING;
}

export class FTP_MAPPING {
  all_streets: Array<{
    street_id: string;
    street_name: string;
    unit_name: string;
  }>;
  mapping: MAPPING;
}

// mappings: Array<{
//   street_id: string;
//   unit_name: string;
//   street_name: string;
//   ftp_assigned: Array<{
//     'week-1': Array<string>;
//     'week-2': Array<string>;
//     'week-3': Array<string>;
//     'week-4': Array<string>;
//   }>;
// }>;
