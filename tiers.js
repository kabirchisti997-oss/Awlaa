// =====================================================================
// tiers.js — Chat Tier & Limit Management System
// Uses localStorage for client-side tracking.
// =====================================================================

// ─── TIER CONFIG ─────────────────────────────────────────────────────
export const TIERS = {
    guest: {
        id: 'guest',
        name: 'Guest',
        label: 'Guest',
        icon: '👤',
        color: '#777777',
        gradient: 'linear-gradient(135deg, #444, #666)',
        limit: 5,
        price: 0,
        priceLabel: 'Free',
        features: ['5 chats / period', 'Limited AI access', 'No memory (Session only)'],
        description: 'Basic access without login',
        contextLimit: 0
    },
    free: {
        id: 'free',
        name: 'Free',
        label: 'Free Tier',
        icon: '⚡',
        color: '#4a9eff',
        gradient: 'linear-gradient(135deg, #1a3a6e, #2d6bc4)',
        limit: 10,
        price: 0,
        priceLabel: 'Free',
        features: ['10 chats / period', 'Google account sync', 'Tiny 2-msg memory'],
        description: 'Signed in with Google',
        contextLimit: 2
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        label: 'Premium',
        icon: '✦',
        color: '#c9a438',
        gradient: 'linear-gradient(135deg, #6b4c10, #c9a438)',
        limit: 30,
        price: 700,
        priceLabel: '₹700 / period',
        features: ['30 chats / period', '10-message memory', 'Priority response', 'All AI features unlocked'],
        description: 'Enhanced AI access',
        contextLimit: 10
    },
    unlimited: {
        id: 'unlimited',
        name: 'Unlimited',
        label: 'Unlimited',
        icon: '♾',
        color: '#a855f7',
        gradient: 'linear-gradient(135deg, #3b065e, #a855f7)',
        limit: Infinity,
        price: 1500,
        priceLabel: '₹1,500 / period',
        features: ['Unlimited chats', 'Max 15-message memory', 'First priority access', 'Exclusive AI models'],
        description: 'Full unrestricted access',
        contextLimit: 15
    }
};

// ─── IST TIME PERIODS ────────────────────────────────────────────────
// Periods defined by their START hour in IST (UTC+5:30)
const IST_PERIODS = [
    { start: 0, end: 3, label: 'Late Night (12AM - 3AM)' },
    { start: 3, end: 6, label: 'Early Morning (3AM - 6AM)' },
    { start: 6, end: 9, label: 'Morning (6AM - 9AM)' },
    { start: 9, end: 12, label: 'Late Morning (9AM - 12PM)' },
    { start: 12, end: 15, label: 'Midday (12PM - 3PM)' },
    { start: 15, end: 18, label: 'Afternoon (3PM - 6PM)' },
    { start: 18, end: 21, label: 'Evening (6PM - 9PM)' },
    { start: 21, end: 24, label: 'Night (9PM - 12AM)' },
];

/**
 * Get current IST hour (0–23).
 */
function getISTHour() {
    const now = new Date();
    // IST = UTC + 5:30 = UTC + 330 minutes
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istMs = utcMs + 330 * 60000;
    return new Date(istMs).getHours();
}

/**
 * Returns the current IST period object { start, end, label }.
 */
export function getISTTimePeriod() {
    const h = getISTHour();
    return IST_PERIODS.find(p => h >= p.start && h < p.end) || IST_PERIODS[0];
}

/**
 * Returns a human-readable string for how long until the next period resets.
 */
export function getTimeUntilReset() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istNow = new Date(utcMs + 330 * 60000);
    const h = istNow.getHours();
    const m = istNow.getMinutes();
    const s = istNow.getSeconds();

    const period = getISTTimePeriod();
    const nextEnd = period.end === 24 ? 24 : period.end;

    const currentMinutes = h * 60 + m;
    const resetMinutes = nextEnd * 60;
    let diffSec = (resetMinutes * 60) - (currentMinutes * 60 + s);
    if (diffSec <= 0) diffSec = 0;

    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

// ─── STORAGE KEYS ────────────────────────────────────────────────────
const KEY_TIER = (uid) => `awlaa_tier_${uid}`;
const KEY_USAGE = (uid) => `awlaa_usage_${uid}`;

/**
 * Get tier for a user.
 * uid = user's ID or 'guest' for unauthenticated users.
 */
export function getUserTier(uid = 'guest') {
    if (uid === 'guest') return TIERS.guest;
    const stored = localStorage.getItem(KEY_TIER(uid));
    return TIERS[stored] || TIERS.free;
}

/**
 * Set tier for a user (called when upgrading).
 */
export function setUserTier(uid, tierId) {
    if (!TIERS[tierId]) return;
    localStorage.setItem(KEY_TIER(uid), tierId);
}

/**
 * Get usage record for user.
 * Returns { count: number, period: string }
 */
export function getUsage(uid = 'guest') {
    const raw = localStorage.getItem(KEY_USAGE(uid));
    if (!raw) return { count: 0, period: getISTTimePeriod().label };
    try { return JSON.parse(raw); } catch { return { count: 0, period: getISTTimePeriod().label }; }
}

/**
 * Check if user can send a message right now.
 */
export function canSendMessage(uid = 'guest') {
    const tier = getUserTier(uid);
    if (tier.limit === Infinity) return true;

    const usage = getUsage(uid);
    const currentPeriod = getISTTimePeriod().label;

    // Period changed → reset count
    if (usage.period !== currentPeriod) return true;

    return usage.count < tier.limit;
}

/**
 * Record a message sent. Resets count if period changed.
 */
export function recordMessage(uid = 'guest') {
    const currentPeriod = getISTTimePeriod().label;
    const usage = getUsage(uid);

    let count = usage.period !== currentPeriod ? 1 : usage.count + 1;
    localStorage.setItem(KEY_USAGE(uid), JSON.stringify({ count, period: currentPeriod }));
    return count;
}

/**
 * Get remaining messages for this period.
 */
export function getRemainingMessages(uid = 'guest') {
    const tier = getUserTier(uid);
    if (tier.limit === Infinity) return Infinity;

    const usage = getUsage(uid);
    const currentPeriod = getISTTimePeriod().label;
    if (usage.period !== currentPeriod) return tier.limit;
    return Math.max(0, tier.limit - usage.count);
}
