/**
 * Pronoun matching for the gender split on /admin/live-ratio.
 *
 * The survey's pronoun field is a fixed <select> offering She/Her, He/Him,
 * They/Them and Other (src/app/(member)/survey/page.tsx). These two patterns
 * are therefore mutually exclusive, and anyone who picked They/Them or Other
 * is simply not counted.
 *
 * This mirrors the mapping the matching algorithm uses — the nested getGender
 * in src/lib/matchmaker/embeddings.ts maps he/him to male, she/her to female
 * and anything else to other. Keep the two in step.
 *
 * Used as case-insensitive SQL LIKE patterns. Neither contains % or _ beyond
 * the leading and trailing wildcards, so there is nothing to escape.
 */
export const MEN_PRONOUN_PATTERN = "%he/him%";
export const WOMEN_PRONOUN_PATTERN = "%she/her%";
