export const PROFILE = {
  name: 'Artem Antonevych',
  role: 'Data Analyst',
  location: 'Rivne, UA · Remote',
  email: 'artem.antonevych.da@gmail.com',
  github: 'https://github.com/Antoneva98',
  linkedin: 'https://www.linkedin.com/in/antonevych',
  telegram: 'https://t.me/antoneva98',
  cv: 'Artem-Antonevych-Data-Analyst-CV.pdf',
}

export const SKILLS: { group: string; items: string[] }[] = [
  { group: 'Data & SQL', items: ['SQL', 'Athena', 'PostgreSQL', 'Window functions', 'CTEs'] },
  { group: 'Python & EDA', items: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn'] },
  { group: 'Visualization', items: ['Tableau', 'Looker Studio'] },
  { group: 'Experimentation', items: ['A/B testing', 'Funnels', 'Cohorts'] },
  { group: 'Automation', items: ['n8n', 'ETL', 'Reporting'] },
]

export type Project = {
  title: string
  year: string
  category: 'Dashboards' | 'SQL / Python' | 'Automation' | 'Reports'
  context: string
  goal: string
  tasks: string
  why: string
  constraints: string
  result: string
  metric: string
  metricLabel: string
  tools: string[]
  nda?: boolean
  links: { label: string; href: string }[]
}

export const PROJECTS: Project[] = [
  {
    title: 'Real-time fraud monitor',
    year: '2026',
    category: 'Dashboards',
    context: '4bill.io · payments',
    goal: 'React to suspicious transactions while it is still cheap to stop them.',
    tasks: 'A live monitor on SQL signal models: hourly today, daily review of yesterday, with alerts.',
    why: 'A live monitor, not batch reports, so the team could act while a case was open.',
    constraints: 'Under NDA, so described not shown. Built on existing Athena and PostgreSQL logs.',
    result: 'Adopted team-wide. Analysis time down ~50%, fraud response from hours to under an hour.',
    metric: '<1h',
    metricLabel: 'fraud response',
    tools: ['SQL', 'Athena', 'PostgreSQL', 'Python', 'Looker Studio'],
    nda: true,
    links: [],
  },
  {
    title: 'Multi-accounting detection & reporting',
    year: '2025',
    category: 'Automation',
    context: '4bill.io · payments',
    goal: 'Take repetitive detection and reporting off the analysts.',
    tasks: 'Automated daily multi-accounting detection and recurring reports with n8n and Python.',
    why: 'Automated with n8n so the team could spend its time on investigation, not manual pulls.',
    constraints: 'Under NDA, so described rather than shown. Built around existing data sources, no schema changes.',
    result: 'Removed about an hour of manual work a day, roughly five hours every week.',
    metric: '~5h',
    metricLabel: 'saved per week',
    tools: ['n8n', 'Python', 'SQL'],
    nda: true,
    links: [],
  },
  {
    title: 'Global sales analytics',
    year: '2025',
    category: 'SQL / Python',
    context: 'Freelance · Python',
    goal: 'Get a clean, joined dataset and see which categories actually drive profit.',
    tasks: 'Removed duplicates, missing values and anomalies, joined the tables, then pivoted revenue, cost and profit by category.',
    why: 'Cleaned and validated the data first, since the profit read is only as good as its inputs.',
    constraints: 'Data spread across tables with inconsistent formatting, duplicates and anomalies.',
    result: 'Office Supplies and Household lead on both revenue and profit, not just turnover.',
    metric: '2',
    metricLabel: 'categories drive profit',
    tools: ['Python', 'Pandas', 'Seaborn'],
    links: [{ label: 'View on GitHub', href: 'https://github.com/Antoneva98/portfolio/tree/main/python/02-global-sales-analytics' }],
  },
  {
    title: 'Email engagement by country',
    year: '2025',
    category: 'SQL / Python',
    context: 'Freelance · SQL',
    goal: 'Find which countries concentrate the most engaged users, not just the most accounts.',
    tasks: 'Joined accounts with email events in BigQuery, then ranked the sent → opened → visited funnel by country with window functions.',
    why: 'Ranked by funnel performance, not raw account count, so big-but-quiet markets did not look like wins.',
    constraints: 'Accounts, sessions and email events lived in separate tables with no single country view.',
    result: 'Surfaced the top markets by engagement and flagged large markets that are under-emailed.',
    metric: 'Top 10',
    metricLabel: 'markets ranked',
    tools: ['SQL', 'BigQuery', 'Window functions'],
    links: [{ label: 'View on GitHub', href: 'https://github.com/Antoneva98/portfolio/tree/main/sql/01-email-engagement-by-country' }],
  },
]

// SAMPLE placeholders — to be replaced with real recommendations.
export const RECOMMENDATIONS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      'Artem turns messy data into something the whole team can actually act on. Calm, precise, and honest about what the numbers do and do not say.',
    name: 'Sample Reviewer',
    role: 'Product Lead (placeholder)',
  },
  {
    quote:
      'He shipped the anti-fraud monitor that changed how fast we respond. Reliable work and very clear communication throughout.',
    name: 'Sample Reviewer',
    role: 'Team Lead (placeholder)',
  },
]
