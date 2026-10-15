import type { Task, TaskPriority, TaskStatus } from '../api/types';

const TITLES = [
  'Prepare sprint demo',
  'Review onboarding copy',
  'Fix login redirect on Android',
  'Write release notes',
  'Book venue for team offsite',
  'Update privacy policy link',
  'Reply to supplier quote',
  'Plan Q4 roadmap review',
  'Renew domain and SSL',
  'Clean up analytics events',
  'Draft customer survey',
  'Archive old project files',
  'Test push notifications on iOS',
  'Order new office chairs',
  'Prepare invoice for October',
  'Set up staging database backup',
  'Record product walkthrough video',
  'Review pull request #142',
  'Call accountant about VAT',
  'Refresh app store screenshots',
  'Migrate cron jobs to scheduler',
  'Collect feedback from beta users',
  'Check accessibility of checkout',
  'Rotate API keys',
  'Prepare hiring scorecard',
  'Update team calendar',
  'Write unit tests for payments',
  'Design empty states',
  'Measure cold start time',
  'Summarise support tickets',
  'Plan content for newsletter',
  'Audit unused dependencies',
  'Translate onboarding to Spanish',
  'Fix dark mode contrast issues',
  'Organise shared drive folders',
  'Prepare board meeting slides',
  'Benchmark list scrolling',
  'Review contractor timesheets',
  'Schedule security review',
  'Tidy up feature flags',
];

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

function isoDate(base: Date, offsetDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Deterministic sample data: the same input date always produces the same tasks. */
export function createSeedTasks(now = new Date()): Task[] {
  return TITLES.map((title, i) => {
    const created = new Date(now.getTime() - (TITLES.length - i) * 3_600_000 * 7);
    return {
      id: `t${String(i + 1).padStart(3, '0')}`,
      title,
      description:
        i % 3 === 0
          ? 'Sample task from the demo data set. Edit it, change its status or swipe it away.'
          : '',
      status: STATUSES[(i * 7) % 3],
      priority: PRIORITIES[(i * 5) % 3],
      dueDate: i % 5 === 4 ? null : isoDate(now, ((i * 11) % 30) - 6),
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    };
  });
}
