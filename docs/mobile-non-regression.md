# Mobile non-regression checklist

Use this checklist to verify all existing features remain available on mobile and desktop.

## Calendar
- [ ] C1 Month header with prev/next month controls (desktop only)
- [ ] C2 Month grid (4–6 weeks) with weekday labels (desktop only)
- [ ] C3 Today highlight and outside-month styling (desktop only)
- [ ] C4 Day tap/click opens drawer
- [ ] C5 Event tap/click opens scheduled post detail
- [ ] C6 Drag idea to day schedules post (desktop only)
- [ ] C7 Drag scheduled post to new day (desktop only)
- [ ] C8 Drag scheduled post to trash deletes (desktop only)
- [ ] C9 Status dots and platform styling visible on events
- [ ] C10 Calendar refreshes after schedule/move/delete/status changes

## Scheduling
- [ ] S1 Scheduled post details visible (date, notes, status)
- [ ] S2 Edit post notes with save/cancel
- [ ] S3 Edit post status with save/cancel
- [ ] S4 Mobile "Move" action updates date
- [ ] S5 Mobile "Remove from calendar" action with confirmation
- [ ] S6 Day list of scheduled posts visible
- [ ] S7 Empty day state shown when no scheduled posts

## Ideas management
- [ ] I1 Tabs: Ideas / Add idea / To film
- [ ] I2 Filters panel toggle
- [ ] I3 Platform and difficulty filters
- [ ] I4 Sort order select
- [ ] I5 Search input
- [ ] I6 Idea card opens idea detail
- [ ] I7 Drag idea to calendar (desktop only)
- [ ] I8 Mobile "Schedule" action on idea card
- [ ] I9 Delete idea action
- [ ] I10 Theme tags add/remove + suggestions
- [ ] I11 Overused keyword warning
- [ ] I12 Similar ideas hint
- [ ] I13 Idea metadata (post count, last posted, difficulty, platform)
- [ ] I14 Add idea form (title, description, platform, difficulty)
- [ ] I15 Edit idea fields (title, description, platform, difficulty, status)
- [ ] I16 Idea stats (times posted, last posted)

## Status tracking
- [ ] T1 Status labels: Not started / Preparing / Ready / Posted
- [ ] T2 Status dots visible on calendar and weekly view
- [ ] T3 Filming queue shows Not started + Preparing
- [ ] T4 Filming queue refresh action works

## Data management
- [ ] D1 Export JSON works
- [ ] D2 Import JSON preview counts
- [ ] D3 Import modes: sync/replace
- [ ] D4 Replace confirm + optional auto-backup
- [ ] D5 Prune missing posts option
- [ ] D6 Import/export success/error messages

## Navigation / global actions
- [ ] N1 Desktop planner panel toggle + resize handle
- [ ] N2 Drawer open/close (desktop side drawer)
- [ ] N3 Mobile bottom tabs: Calendar / Ideas / To film / Data
- [ ] N4 Mobile drawer bottom sheet with Back navigation
- [ ] N5 Logout action available (desktop + mobile)
- [ ] N6 Quit app action available (desktop + mobile)
- [ ] N7 Status toast appears for auth/logout/shutdown messages
- [ ] N8 Login flow works and auth state is respected
