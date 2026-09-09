/**
 * @akouo/ui — shared React component library.
 *
 * Components build on tokens from `@akouo/theme`, never the other way around
 * (theme ← ui ← apps).
 */
export const UI_PACKAGE = "@akouo/ui" as const;

export { cn } from "./lib/cn";

/*
 * Anything Kosmos already ships is deliberately not re-exported here: a
 * component this package no longer owns should be imported from the library
 * that does, so a call site says where its button comes from. What stays is
 * either absent from `@aether-zone/kosmos` or specific to Akouo's domain.
 *
 * Moved to `@aether-zone/kosmos`: Accordion, Autocomplete, Avatar, Breadcrumb
 * (as Breadcrumbs), Button, CommandPalette (as Command), ConfirmDialog (as
 * AlertDialog), ContextMenu, DatePicker, Dialog, Drawer, DropdownMenu (as
 * Dropdown), FileUpload, FormField (as Field), Heading, IconButton (as
 * Button), InputGroup, Kbd, Label, Link, List, Pagination, PasswordInput,
 * PinInput (as Otp), Popover, ProgressBar (as Progress), Radio, RadioGroup,
 * SearchInput, Sidebar (as Sidenav), Skeleton, Slider, Spinner, Switch, Table,
 * Tabs, Text, Toast, ToggleGroup, Tooltip.
 */

// Form controls
export { NumberInput } from "./NumberInput";
export type { NumberInputProps } from "./NumberInput";

export { TagInput } from "./TagInput";
export type { TagInputProps } from "./TagInput";

export { Calendar } from "./Calendar";
export type { CalendarProps } from "./Calendar";

export { TimePicker } from "./TimePicker";
export type { TimePickerProps } from "./TimePicker";

export { CheckboxGroup, CheckboxGroupItem } from "./CheckboxGroup";
export type {
  CheckboxGroupProps,
  CheckboxGroupItemProps,
} from "./CheckboxGroup";

// Actions & navigation
export { ButtonGroup } from "./ButtonGroup";
export type { ButtonGroupProps } from "./ButtonGroup";

export { ToggleButton } from "./Toggle";
export type { ToggleButtonProps } from "./Toggle";

// Feedback & status
export { RecordingIndicator } from "./RecordingIndicator";
export type { RecordingIndicatorProps } from "./RecordingIndicator";

// Overlays
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./HoverCard";

// Layout & structure
export { Container } from "./Container";
export type { ContainerProps } from "./Container";

export { Stack } from "./Stack";
export type { StackProps } from "./Stack";

export { Grid } from "./Grid";
export type { GridProps } from "./Grid";

export { ScrollArea } from "./ScrollArea";
export type { ScrollAreaProps } from "./ScrollArea";

export { AspectRatio } from "./AspectRatio";
export type { AspectRatioProps } from "./AspectRatio";

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./Collapsible";
export type { CollapsibleProps } from "./Collapsible";

export { ResizablePanels } from "./ResizablePanels";
export type { ResizablePanelsProps } from "./ResizablePanels";

// Data display & typography
export { Prose } from "./Prose";
export type { ProseProps } from "./Prose";

export { Stat } from "./Stat";
export type { StatProps } from "./Stat";

export { DataTable } from "./DataTable";
export type { DataTableProps, DataTableColumn } from "./DataTable";

// Akouo domain
export type { Speaker } from "./lib/speaker";
export { SPEAKERS, speakerName } from "./lib/speaker";

export { Timecode, formatTimecode } from "./Timecode";
export type { TimecodeProps } from "./Timecode";

export { SpeakerTag } from "./SpeakerTag";
export type { SpeakerTagProps } from "./SpeakerTag";

export { SpeakerLegend } from "./SpeakerLegend";
export type { SpeakerLegendProps, SpeakerLegendEntry } from "./SpeakerLegend";

export { SpeakerPicker } from "./SpeakerPicker";
export type { SpeakerPickerProps } from "./SpeakerPicker";

export { Waveform } from "./Waveform";
export type { WaveformProps } from "./Waveform";

export { TranscriptView } from "./TranscriptView";
export type {
  TranscriptViewProps,
  TranscriptSegment,
} from "./TranscriptView";

export { TransportControls } from "./TransportControls";
export type { TransportControlsProps } from "./TransportControls";

export { AudioPlayer } from "./AudioPlayer";
export type { AudioPlayerProps } from "./AudioPlayer";

export { LiveCaption } from "./LiveCaption";
export type { LiveCaptionProps } from "./LiveCaption";

export { DiarizationTimeline } from "./DiarizationTimeline";
export type {
  DiarizationTimelineProps,
  DiarizationSegment,
} from "./DiarizationTimeline";

// Theming — a provider, where Kosmos ships only a `useTheme` hook.
export { ThemeProvider, useTheme } from "./ThemeProvider";
export type { ThemeProviderProps, Theme, ResolvedTheme } from "./ThemeProvider";

export { ThemeToggle } from "./ThemeToggle";
export type { ThemeToggleProps } from "./ThemeToggle";
