/**
 * Single Source of Truth for LiveTrafficNPC Application Versioning
 * 
 * Follows Semantic Versioning (SemVer):
 * - MAJOR: Significant architectural overhauls, major redesigns
 * - MINOR: New features, expanded capabilities, major UI workflows
 * - PATCH: Bug fixes, operational adjustments, performance optimizations
 */

export const APP_VERSION = '2.10.0';
export const APP_STAGE = 'BETA';
export const BUILD_DATE = '2026-09-21';
export const BUILD_NUMBER = '2026.09.21-PROD-2100';

export const getFullVersionString = (): string => `v${APP_VERSION}`;
export const getBadgeVersionString = (): string => `${APP_STAGE} v${APP_VERSION}`;
