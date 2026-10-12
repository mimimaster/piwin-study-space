import { unresolved, type Course, type Document } from './model.js';
import type { Active } from './native.js';

/** Saved attempts are evidence, never an invented mastery percentage. */
export function teachingStatus(active: Active | undefined, courses: Course[], preferences: Document | null): string[] {
  const labels = { off: '关闭 / Off', ta: '助教 / TA', learn: '学习 / Learn', review: '复习 / Review' };
  const lines = [
    'Study Space · 学习进度 / Teaching status',
    `模式 / Mode: ${labels[active?.role ?? 'off']}`,
    `当前课程 / Current course: ${active?.course?.topic ?? '无 / None'}`,
    `制卡偏好 / Cards: ${preferences && 'cards' in preferences && preferences.cards === 'never' ? '不制卡 / Never' : '先询问 / Ask first'}`,
  ];
  if (courses.length === 0) lines.push('没有已保存课程 / No saved courses. /teacher-learn 开始学习。');
  for (const course of courses) {
    lines.push(`${course.topic}: ${course.evidence.length} 次练习记录 / practice records · ${course.path.length} 个路径阶段 / planned stages`);
    const latest = course.evidence.at(-1);
    if (latest) lines.push(`  下一次练习 / Next practice: ${latest.nextPractice}`);
    if (unresolved(course)) lines.push('  有待核对的制卡结果 / Card creation needs reconciliation.');
  }
  lines.push('继续 / Resume: /teacher-resume · 复习 / Review: /teacher-review · 退出 / Leave: /teacher-off');
  return lines;
}
