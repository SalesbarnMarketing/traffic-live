/**
 * Single Source of Truth for LiveTrafficNPC Application Versioning
 * 
 * Follows Semantic Versioning (SemVer):
 * - MAJOR: Significant architectural overhauls, major redesigns
 * - MINOR: New features, expanded capabilities, major UI workflows
 * - PATCH: Bug fixes, operational adjustments, performance optimizations
 */

export const APP_VERSION = '2.12.0';
export const APP_STAGE = 'BETA';
export const BUILD_DATE = '2026-10-01';
export const BUILD_NUMBER = '2026.10.01-PROD-2120';

export const getFullVersionString = (): string => `v${APP_VERSION}`;
export const getBadgeVersionString = (): string => `${APP_STAGE} v${APP_VERSION}`;
