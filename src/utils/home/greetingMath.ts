export type GreetingPeriod =
    | 'lateNight'
    | 'morning'
    | 'forenoon'
    | 'noon'
    | 'afternoon'
    | 'evening'
    | 'night';

// src/utils/home/greetingMath.ts
// Time-of-day greeting for the signed-in recent-listen card.

export const GREETING_PERIOD_I18N_KEY: Record<GreetingPeriod, string> = {
    lateNight: 'home.greetingLateNight',
    morning: 'home.greetingMorning',
    forenoon: 'home.greetingForenoon',
    noon: 'home.greetingNoon',
    afternoon: 'home.greetingAfternoon',
    evening: 'home.greetingEvening',
    night: 'home.greetingNight',
};

export const resolveGreetingPeriod = (hour: number): GreetingPeriod => {
    const wrapped = ((Math.floor(hour) % 24) + 24) % 24;
    if (wrapped < 5) return 'lateNight';
    if (wrapped < 8) return 'morning';
    if (wrapped < 11) return 'forenoon';
    if (wrapped < 13) return 'noon';
    if (wrapped < 18) return 'afternoon';
    if (wrapped < 22) return 'evening';
    return 'night';
};

export const greetingI18nKey = (hour: number = new Date().getHours()): string =>
    GREETING_PERIOD_I18N_KEY[resolveGreetingPeriod(hour)];
