/**
 * Formatting for the dashboard. Nothing here may import server-only code.
 *
 * Both live in daimon now: loculus needed the same two, and each app's copy
 * handled an edge the other got wrong. Re-exported rather than imported
 * directly at each call site so `@/lib/format` stays this app's one formatting
 * entry point.
 *
 * One visible change: sizes of ten or more in a unit no longer carry a decimal,
 * so a recording that read "15.0 kB" now reads "15 kB". Sizes below ten keep
 * theirs ("1.5 MB"), and whole bytes never had one.
 */

export { formatBytes, initials } from "@aether-zone/daimon/format";
