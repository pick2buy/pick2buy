import { prisma } from './prisma';
import { randomBytes } from 'crypto';
export async function rewardReferral(userId: string) {
  await prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user?.isEmailVerified || !user.referredById || user.referralRewarded) return;
    const referrer = await tx.user.findFirst({ where: { id: user.referredById, isBlocked: false } });
    if (!referrer || referrer.id === user.id) return;
    const claim = await tx.user.updateMany({ where: { id: userId, referralRewarded: false }, data: { referralRewarded: true } });
    if (!claim.count) return;
    const code = 'REF' + randomBytes(6).toString('hex').toUpperCase();
    await tx.coupon.create({ data: { code, description: 'Referral reward: 10% off, up to INR 100', type: 'PERCENTAGE', value: 10, maxDiscount: 100, minOrderValue: 499, usageLimit: 1, perUserLimit: 1, restrictedUserId: referrer.id, startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000) } });
    await tx.notification.create({ data: { userId: referrer.id, title: 'Referral reward earned', message: `Your friend joined! Use ${code} for 10% off (up to INR 100) on orders of INR 499 or more within 30 days.`, type: 'REFERRAL' } });
  });
}
