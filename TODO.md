# temporal-calendar TODO

## Pain Points from PostCalendar Demo Analysis

### Date Filtering & Grouping Utilities
**Priority: MEDIUM**
- Provide `filterEventsByDate()` utility to filter events for a specific PlainDate
- Provide `groupEventsByDate()` utility to group events by date with automatic sorting
- Both currently require manual `Temporal.PlainDate.compare()` implementation
- Found in: PostMonthlyView.tsx:147-164, PostAgendaView.tsx:25-40

### Type Definition Export/Sharing
**Priority: MEDIUM**
- Allow view config types to be exported/shared from the library
- `PostViewConfigs` is currently duplicated across 5 files (PostCalendar, PostMonthlyView, PostDailyView, PostWeeklyView, PostAgendaView)
- Consider providing generic view config type helpers

### Timestamp Formatting Utilities
**Priority: LOW-MEDIUM**
- Provide formatting utilities or `useCalendarFormatter()` hook
- Currently each view formats timestamps differently with manual `toLocaleString()` calls
- Found in all 4 view components with inconsistent patterns

### Today Detection Helper
**Priority: LOW**
- Provide `useTodayDate()` hook or `isToday(date)` utility
- `Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO()) === 0` is duplicated
- Found in: PostWeeklyView.tsx:38-41, PostAgendaView.tsx:53-55

## Notes
- UTC-to-Timezone conversion is intentionally NOT part of this library (handled in data layer)
- UI components are intentionally NOT provided (zero abstractions philosophy - users build their own UI)
