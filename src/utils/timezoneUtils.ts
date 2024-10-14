type TimezoneMap = { [key: string]: string };

const timezoneAbbreviations: TimezoneMap = {
    '-12:00': 'IDLW', '-11:00': 'SST', '-10:00': 'HST', '-09:30': 'MIT',
    '-09:00': 'AKST', '-08:00': 'PST', '-07:00': 'MST', '-06:00': 'CST',
    '-05:00': 'EST', '-04:00': 'AST', '-03:30': 'NST', '-03:00': 'BRT',
    '-02:00': 'FNT', '-01:00': 'CVT', '+00:00': 'GMT', '+01:00': 'CET',
    '+02:00': 'EET', '+03:00': 'MSK', '+03:30': 'IRST', '+04:00': 'GST',
    '+04:30': 'AFT', '+05:00': 'PKT', '+05:30': 'IST', '+05:45': 'NPT',
    '+06:00': 'BST', '+06:30': 'MMT', '+07:00': 'ICT', '+08:00': 'CST',
    '+08:45': 'ACWST', '+09:00': 'JST', '+09:30': 'ACST', '+10:00': 'AEST',
    '+10:30': 'ACDT', '+11:00': 'AEDT', '+12:00': 'NZST', '+12:45': 'CHAST',
    '+13:00': 'NZDT', '+14:00': 'LINT',
    'ET': 'EST/EDT',
    'CT': 'CST/CDT',
    'MT': 'MST/MDT',
    'PT': 'PST/PDT',
    // Add more as needed
  };
  
  export function getTimezoneAbbreviation(timezone: string): string {
    return timezoneAbbreviations[timezone] || timezone;
  }

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
