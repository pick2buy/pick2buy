export const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function returnDeadline(status: string, timeline: { status: string; createdAt: Date }[]) {
  if (status !== 'DELIVERED') return null;
  const deliveredAt = timeline.find(entry => entry.status === 'DELIVERED')?.createdAt;
  return deliveredAt ? new Date(deliveredAt).getTime() + RETURN_WINDOW_MS : null;
}

export function canRequestReturn(status: string, timeline: { status: string; createdAt: Date }[], now = Date.now()) {
  const deadline = returnDeadline(status, timeline);
  return deadline !== null && now < deadline;
}
