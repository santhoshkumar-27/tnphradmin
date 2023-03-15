export class Constants {
  static CURRENT_USER = 'current_user';
  static ROLE_SUPER_ADMIN = 'super_admin';
  static ROLE_STATE_ADMIN = 'state_admin';
  static ROLE_DISTRICT_ADMIN = 'district_admin';
  static ROLE_BLOCK_ADMIN = 'block_admin';
  static GLOBAL_FACILITY_LIST = 'global_facility_list';
  static GLOBAL_STREET_LIST = 'global_street_list';
  static SUCCESS_FLAG = 'SUCCESS';
  static FAILURE_FLAG = 'FAIL';

  static STATE_ADMIN = 'STATE_ADMIN';
  static WEB_STATE_ADMIN = 'WEB_STATE_ADMIN';
  static WEB_BLOCK_ADMIN = 'WEB_BLOCK_ADMIN';
  static WEB_DISTRICT_ADMIN = 'WEB_DISTRICT_ADMIN';
  static BLOCK_ADMIN = 'BLOCK_ADMIN';
  static DISTRICT_ADMIN = 'DISTRICT_ADMIN';

  static GOVT_DEPT_HEALTH = 'Health';
  static GOVT_DEPT_ICDS = 'ICDS';

  static EMAIL_PATTERN =
    '[a-zA-Z0-9]+[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}';

  static PHR_ROLE_STATE = [
    { name: 'MOBILE_COMMUNITY_STAFF' },
    { name: 'MOBILE_MEDICAL_STAFF' },
    { name: 'MOBILE_IT_SUPPORT' },
    { name: 'WEB_STATE_ADMIN' },
    { name: 'WEB_DISTRICT_ADMIN' },
    { name: 'WEB_BLOCK_ADMIN' },
    { name: 'DASHBOARD_STATE_USER' },
    { name: 'DASHBOARD_DISTRICT_USER' },
    { name: 'DASHBOARD_BLOCK_USER' },
    { name: 'DASHBOARD_FACILITY_USER' },
    { name: 'DASHBOARD_INDIVIDUAL_USER' },
    { name: 'STATE_ADMIN' },
    { name: 'DISTRICT_ADMIN' },
    { name: 'BLOCK_ADMIN' },
  ];

  static PHR_ROLE_DISTRICT = [
    { name: 'MOBILE_COMMUNITY_STAFF' },
    { name: 'MOBILE_MEDICAL_STAFF' },
    { name: 'MOBILE_IT_SUPPORT' },
    { name: 'WEB_BLOCK_ADMIN' },
    { name: 'DASHBOARD_DISTRICT_USER' },
    { name: 'DASHBOARD_BLOCK_USER' },
    { name: 'DASHBOARD_FACILITY_USER' },
    { name: 'DASHBOARD_INDIVIDUAL_USER' },
    { name: 'BLOCK_ADMIN' },
  ];

  static PHR_ROLE_BLOCK = [
    { name: 'MOBILE_COMMUNITY_STAFF' },
    { name: 'MOBILE_MEDICAL_STAFF' },
    { name: 'MOBILE_IT_SUPPORT' },
    { name: 'DASHBOARD_FACILITY_USER' },
    { name: 'DASHBOARD_INDIVIDUAL_USER' },
  ];

  static STATUS = [
    { name: 'Deputed' },
    { name: 'Diverted' },
    { name: 'Original Station' },
    { name: 'Retired' },
    { name: 'Others' },
  ];

  static EMPLOYEE_TYPE = [
    { name: 'Regular' },
    { name: 'Probationer' },
    { name: 'Outsourcing' },
    { name: 'Contractual' },
    { name: 'Daily wages' },
    { name: 'Volunteer' },
  ];

  static BLOCK_TYPE = [
    { name: '' },
    { name: 'Rural Block' },
    { name: 'Municipality' },
    { name: 'Corporation' },
    { name: 'Others' },
  ];

  static ROLE_IN_FACILITY_ADMIN = [{ name: 'Admin' }, { name: 'User' }];

  static ROLE_IN_FACILITY_USER = [{ name: 'User' }];

  static NATURE_OF_WORK = [
    { name: 'Field' },
    { name: 'Institutional' },
    { name: 'Supervisor' },
  ];

  static HSC_FILTERED_SUB_FACILITIES = {
    departments: ['General OP'],
    clinics: ['OP'],
    clinic_types: ['General'],
  };

  static PHC_FILTERED_SUB_FACILITIES = {
    departments: ['General OP', 'Ncd Screening OP'],
    clinics: ['OP'],
    clinic_types: ['General'],
  };

  static NHM_STATE_ADMIN_FACILITY = 'NHM State Admin';
  static TNPHR_ADMIN_FACILITY = 'admin@tnphr.in';
  static STATE_SUPERVISOR_ROLE = 'State Supervisor';
  static ADMIN_FACILITY_USER_ROLE = 'Admin';
  static NHM_DIRCTORATE = 'NHM';

  static HWC_OPTIONS = [
    {
      name: 'Not HWC',
    },
    {
      name: 'HWC 2017 - 18',
    },
    {
      name: 'HWC 2018 - 19',
    },
    {
      name: 'HWC 2019 - 20',
    },
    {
      name: 'HWC 2020 - 21',
    },
    {
      name: 'HWC 2021 - 22',
    },
    {
      name: 'HWC 2022 - 23',
    },
  ];

  static HSC_UNIT_LIST = [
    {
      name: 'Unit-1',
      value: 'unit-1',
    },
    {
      name: 'Unit-2',
      value: 'unit-2',
    },
    {
      name: 'Unit-3',
      value: 'unit-3',
    },
    {
      name: 'Unit-4',
      value: 'unit-4',
    },
  ];

  static VILLAGE_TYPE = [
    { name: 'Village Panchayat', value: "VP" },
    { name: 'Town Panchayat', value: "TP" },
    { name: 'Corporation', value: "CO" },
    { name: 'Municipal', value: "MP" },
    { name: 'Other', value: "OT" },
  ];

  // user roles mapping with phr roles
  static ROLE_VS_PHRROLE_MAPPING_STATE = new Map([
    [
      [
        'Women Health Volunteer',
        'Mid Level Health Provider',
        'Village Health Nurse (Regular)',
      ],
      [{ name: 'MOBILE_COMMUNITY_STAFF' }],
    ],
    [
      ['NCD Staff Nurse', 'Palliative Staff Nurse', 'Physiotherapist'],
      [{ name: 'MOBILE_MEDICAL_STAFF' }],
    ],
    [['Block Medical Officer - BMO'], [{ name: 'BLOCK_ADMIN' }]],
    [
      ['Assistant Program Manager - APM', 'DPO NCD'],
      [{ name: 'DISTRICT_ADMIN' }],
    ],
  ]);

  static ROLE_VS_PHRROLE_MAPPING_DISTRICT = new Map([
    [
      [
        'Women Health Volunteer',
        'Mid Level Health Provider',
        'Village Health Nurse (Regular)',
      ],
      [{ name: 'MOBILE_COMMUNITY_STAFF' }],
    ],
    [
      ['NCD Staff Nurse', 'Palliative Staff Nurse', 'Physiotherapist'],
      [{ name: 'MOBILE_MEDICAL_STAFF' }],
    ],
    [['Block Medical Officer - BMO'], [{ name: 'BLOCK_ADMIN' }]],
    [['Assistant Program Manager - APM', 'DPO NCD'], []],
  ]);

  static ROLE_VS_PHRROLE_MAPPING_BLOCK = new Map([
    [
      [
        'Women Health Volunteer',
        'Mid Level Health Provider',
        'Village Health Nurse (Regular)',
      ],
      [{ name: 'MOBILE_COMMUNITY_STAFF' }],
    ],
    [
      ['NCD Staff Nurse', 'Palliative Staff Nurse', 'Physiotherapist'],
      [{ name: 'MOBILE_MEDICAL_STAFF' }],
    ],
    [['Block Medical Officer - BMO'], []],
    [['Assistant Program Manager - APM', 'DPO NCD'], []],
  ]);
}
