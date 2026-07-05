export type PortfolioHealth = 'Green' | 'Amber' | 'Red'

export type HolderType =
  | 'Founder' | 'Angel' | 'Syndicate' | 'TVCLabs'
  | 'TD' | 'Corporate Investor' | 'VC Fund'
  | 'Employee' | 'Advisor' | 'Other'

export type ExposureType =
  | 'Equity' | 'SAFE' | 'Convertible Note' | 'Advisory Equity'
  | 'Option' | 'Warrant' | 'Revenue Share'
  | 'Carry Participation' | 'Board Seat' | 'Observer Rights' | 'Other'

export type ExposureStatus = 'Active' | 'Converted' | 'Cancelled' | 'Exited'

export type UpdateStatus = 'Draft' | 'Submitted' | 'Reviewed'

export type DocStatus = 'Missing' | 'Submitted' | 'Reviewed' | 'Verified' | 'Outdated'

export type PoemSection =
  | 'Vision' | 'Proposition' | 'Organisation'
  | 'Economics' | 'Milestones' | 'Administration'

export type AdvisorType = 'TD' | 'TVCLabs' | 'Angel' | 'External'