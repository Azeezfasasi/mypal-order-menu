# MyPal Business Admin Dashboard – Manual Test Case Suite

This document lists manual test cases for high-value business workflows. Use alongside `TESTING.md` (automation guide). Update Status after execution: Pass / Fail / Blocked / N/A. Record defects with reference IDs.

---

## 1. Legend & Conventions

| Field           | Meaning                                         |
| --------------- | ----------------------------------------------- |
| ID              | Unique test identifier (MODULE-NNN)             |
| Priority        | H = High (release blocker), M = Medium, L = Low |
| Preconditions   | State / data required before starting           |
| Test Data       | Specific input values (mask secrets)            |
| Steps           | Ordered actions to perform                      |
| Expected Result | Observable outcome / UI / side-effect           |
| Notes           | Edge cases / follow‑ups                         |
| Status          | (Leave blank; fill during execution)            |

General Preconditions (unless overridden):

- User has modern browser (Chrome latest) and stable network.
- Backend API base URL configured in `.env.local`.
- Test business account available (or create via Signup flow).

---

## 2. Authentication & Account Management

### Test Cases

| ID       | Title                                    | Priority | Preconditions              | Test Data                                     | Steps                                                                | Expected Result                                                        | Notes                           | Status |
| -------- | ---------------------------------------- | -------- | -------------------------- | --------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------- | ------ |
| AUTH-001 | Business Signup (valid)                  | H        | Not logged in              | Email: new+uniq@biz.com / Password: P@ssw0rd! | 1 Open /signup 2 Fill email & password 3 Submit                      | Success toast; redirect or instruction to verify; API 200              | Capture network payload         |        |
| AUTH-002 | Signup Existing Email                    | H        | Existing user email        | Existing email                                | 1 Open /signup 2 Enter existing email 3 Submit                       | Error toast with server message; no session created                    |                                 |        |
| AUTH-003 | Signin Success                           | H        | Verified account exists    | Valid credentials                             | 1 Open /signin 2 Enter creds 3 Submit                                | Redirect to dashboard; auth cookies set; store tokenType=authenticated | Check localStorage persist      |        |
| AUTH-004 | Signin Invalid Password                  | H        | Account exists             | Wrong password                                | 1 Open /signin 2 Enter wrong pass 3 Submit                           | Error toast; stay on page; no token                                    |                                 |        |
| AUTH-005 | Forgot Password Flow                     | H        | Account exists             | Registered email; OTP from backend            | 1 Click Forgot 2 Enter email 3 Submit 4 Enter OTP 5 Set new password | Each step success toast; final state tokenType=authenticated           | Validate OTP error msg if wrong |        |
| AUTH-006 | Logout                                   | H        | Logged in                  | n/a                                           | 1 Open menu 2 Click Logout                                           | Token & tokenType cleared; redirected to /signin                       | Check cookies deleted           |        |
| AUTH-007 | Update Business Profile (text fields)    | M        | Logged in                  | New business name, start date                 | 1 Navigate Settings 2 Edit name/date 3 Save                          | Success toast; updated data persists after refresh                     |                                 |        |
| AUTH-008 | Update Business Image                    | M        | Logged in; have image file | image.jpg ( <1MB )                            | 1 Settings 2 Upload image 3 Save                                     | Spinner then success; avatar updates                                   | Test invalid > limit size       |        |
| AUTH-009 | Delete Business Account (confirm dialog) | H        | Logged in test account     | n/a                                           | 1 Settings 2 Delete 3 Confirm                                        | Account removed; user logged out; subsequent signin fails              | Perform last in cycle           |        |

---

## 3. KYB / Business Onboarding

| ID      | Title                     | Priority | Preconditions             | Steps                                                | Expected Result                                   | Notes | Status |
| ------- | ------------------------- | -------- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------- | ----- | ------ |
| KYB-001 | Enter Required KYB Fields | H        | Logged in; KYB incomplete | 1 Navigate KYB page 2 Fill mandatory fields 3 Submit | Validation passes; status updated (e.g., Pending) |       |        |
| KYB-002 | Field Validation Errors   | M        | None                      | 1 Submit empty form                                  | Inline errors for each required field             |       |        |
| KYB-003 | KYB Status Persistence    | M        | KYB submitted             | 1 Reload app                                         | Status consistent with backend                    |       |        |

---

## 4. Deals Management

| ID       | Title                            | Priority | Preconditions              | Test Data                                    | Steps                                                                                    | Expected Result                                                | Notes                                   | Status |
| -------- | -------------------------------- | -------- | -------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------- | ------ |
| DEAL-001 | Create Deal (Full Data)          | H        | Logged in                  | See sample: title: Weekend Promo, price 5000 | 1 Deals > New 2 Fill form (dates, times auto duration) 3 Add benefits & agendas 4 Submit | Success toast; list refetch shows new deal top or correct page | Check React Query devtools invalidation |        |
| DEAL-002 | Benefit Removal                  | M        | Existing draft deal        | n/a                                          | 1 Edit deal 2 Remove a benefit 3 Save                                                    | Removed benefit not shown; other data intact                   |                                         |        |
| DEAL-003 | Update Deal Image                | M        | Existing deal              | new-image.jpg                                | 1 Edit deal 2 Replace image 3 Save                                                       | New image visible in preview/list                              |                                         |        |
| DEAL-004 | Delete Deal                      | H        | Existing deal              | n/a                                          | 1 Open deal actions 2 Delete 3 Confirm                                                   | Success toast; deal removed from list                          | Attempt refresh to confirm              |        |
| DEAL-005 | Upcoming Deals View              | M        | At least one upcoming deal | n/a                                          | 1 Navigate Upcoming deals                                                                | List shows only future deals                                   | Validate date filter edge               |        |
| DEAL-006 | Invalid Date Range (End < Start) | M        | n/a                        | Start > End                                  | 1 Create deal with inverted dates 2 Submit                                               | Validation prevents submission; appropriate error              | Duration empty                          |        |

---

## 5. Events & Flyer Generation

| ID      | Title                              | Priority | Preconditions                          | Steps                                                      | Expected Result                                     | Notes                       | Status |
| ------- | ---------------------------------- | -------- | -------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | --------------------------- | ------ |
| EVT-001 | Create Event                       | H        | Logged in                              | 1 Events > New 2 Fill mandatory fields 3 Submit            | Event appears in list; success toast                |                             |        |
| EVT-002 | Generate AI Flyer (Success)        | H        | Event exists or creation form supports | 1 Open flyer generator 2 Provide prompt / details 3 Submit | Loading indicator → flyer preview renders image URL | Check network call          |        |
| EVT-003 | Generate AI Flyer (Error)          | M        | Force backend error                    | 1 Submit with backend returning 500                        | Error toast; previous state unaffected              | Use MSW or staging error    |        |
| EVT-004 | Event Date + Time Duration Display | M        | Event with valid time range            | 1 View event detail                                        | Duration string matches calculation util            | Cross-verify with util test |        |
| EVT-005 | Delete Event                       | H        | Existing event                         | 1 Delete via actions                                       | Removed from list; success toast                    |                             |        |

---

## 6. Reservations (Buffet / Event)

| ID      | Title                         | Priority | Preconditions                         | Steps                   | Expected Result                         | Notes                     | Status |
| ------- | ----------------------------- | -------- | ------------------------------------- | ----------------------- | --------------------------------------- | ------------------------- | ------ |
| RSV-001 | View Buffet Reservations List | H        | Logged in; reservations exist         | 1 Navigate Reservations | List populates with correct pagination  |                           |        |
| RSV-002 | View Reservation Detail       | M        | Reservation ID known                  | 1 Open detail page      | All fields render; status badge correct |                           |        |
| RSV-003 | Verify Payment (Success)      | H        | Pending reservation with reference id | 1 Click Verify Payment  | Status updates to Paid; success toast   | Simulate with test ref id |        |
| RSV-004 | Verify Payment (Failure)      | M        | Invalid reference id                  | 1 Verify Payment        | Error toast; status unchanged           |                           |        |

---

## 7. Reviews & Engagement

| ID      | Title                 | Priority | Preconditions  | Steps                                | Expected Result                          | Notes                    | Status |
| ------- | --------------------- | -------- | -------------- | ------------------------------------ | ---------------------------------------- | ------------------------ | ------ |
| REV-001 | List Business Reviews | M        | Reviews exist  | 1 Go to Reviews                      | Table/cards show ratings + relative time | Check date distance text |        |
| REV-002 | Toggle Review Display | M        | Review visible | 1 Toggle display                     | Status/style changes; backend updated    |                          |        |
| REV-003 | Add Comment to Review | M        | Review exists  | 1 Open review 2 Add comment 3 Submit | Comment appended with user & timestamp   | Empty input blocked      |        |
| REV-004 | Add Reaction (Like)   | L        | Review exists  | 1 Click reaction button              | Counter increments (optimistic)          | Revert on failure        |        |

---

## 8. Service Offerings (Menus / Items / Accommodations / Attractions)

| ID      | Title                    | Priority | Preconditions     | Steps                                       | Expected Result                       | Notes | Status |
| ------- | ------------------------ | -------- | ----------------- | ------------------------------------------- | ------------------------------------- | ----- | ------ |
| SVC-001 | Create Service Category  | H        | Logged in         | 1 Offerings > Add Category                  | Category listed; success toast        |       |        |
| SVC-002 | Create Service Item      | H        | Category exists   | 1 Add Item to category                      | Item appears nested under category    |       |        |
| SVC-003 | Update Service Item      | M        | Item exists       | 1 Edit item 2 Save                          | Fields updated & persist on refresh   |       |        |
| SVC-004 | Delete Service Item      | M        | Item exists       | 1 Delete item 2 Confirm                     | Item removed                          |       |        |
| SVC-005 | Create Accommodation     | M        | Logged in         | 1 Add Accommodation 2 Provide fields 3 Save | Appears in list                       |       |        |
| SVC-006 | Toggle Attraction Status | M        | Attraction exists | 1 Toggle status                             | Status badge / disabled state updates |       |        |

---

## 9. Operating & Blackout Days

| ID      | Title                | Priority | Preconditions     | Steps                                              | Expected Result                 | Notes                  | Status |
| ------- | -------------------- | -------- | ----------------- | -------------------------------------------------- | ------------------------------- | ---------------------- | ------ |
| OPD-001 | Add Operating Day    | M        | Logged in         | 1 Operating Days > Add 2 Select day & hours 3 Save | New day shown in list           | Hours format validated |        |
| OPD-002 | Update Operating Day | M        | Existing day      | 1 Edit hours 2 Save                                | Updated hours display correctly |                        |        |
| OPD-003 | Delete Operating Day | M        | Existing day      | 1 Delete 2 Confirm                                 | Entry removed                   |                        |        |
| BOD-001 | Add Blackout Day     | M        | Logged in         | 1 Blackout > Add 2 Pick date 3 Save                | Date appears in list            | Prevent duplicates     |        |
| BOD-002 | Delete Blackout Day  | M        | Existing blackout | 1 Delete 2 Confirm                                 | Removed from list               |                        |        |

---

## 10. Media Management

| ID      | Title             | Priority | Preconditions         | Steps                                   | Expected Result                       | Notes             | Status |
| ------- | ----------------- | -------- | --------------------- | --------------------------------------- | ------------------------------------- | ----------------- | ------ |
| MED-001 | Upload Media File | M        | Logged in; have image | 1 Media > Upload 2 Choose file 3 Submit | File thumbnail appears; success toast | Test invalid type |        |
| MED-002 | List Media Items  | L        | Items exist           | 1 Media page                            | All uploaded items displayed          |                   |        |
| MED-003 | Delete Media Item | M        | Item exists           | 1 Delete icon 2 Confirm                 | Item removed                          |                   |        |

---

## 11. Reports / Revenue Analytics

| ID      | Title                        | Priority | Preconditions    | Steps                                              | Expected Result                                  | Notes                      | Status |
| ------- | ---------------------------- | -------- | ---------------- | -------------------------------------------------- | ------------------------------------------------ | -------------------------- | ------ |
| RPT-001 | Load Dashboard Metrics       | H        | Logged in        | 1 Open Dashboard                                   | KPIs load without error; loading states replaced |                            |        |
| RPT-002 | Change Date Range (Preset)   | M        | Dashboard loaded | 1 Select This Month preset                         | Charts & KPIs update; API called once            |                            |        |
| RPT-003 | Custom Date Range Validation | M        | n/a              | 1 Enter start & end 2 Also pick timeframe 3 Submit | Error preventing mixed input                     | Based on validateDateRange |        |

---

## 12. Transaction Settings

| ID      | Title                    | Priority | Preconditions         | Steps                       | Expected Result                               | Notes                       | Status |
| ------- | ------------------------ | -------- | --------------------- | --------------------------- | --------------------------------------------- | --------------------------- | ------ |
| TRX-001 | View Business Charges    | M        | Logged in             | 1 Open Transaction Settings | List of charge types visible                  |                             |        |
| TRX-002 | Toggle Charge Type       | M        | Charge entry present  | 1 Toggle a charge           | UI reflects enabled/disabled; backend success |                             |        |
| TRX-003 | Update Business Discount | M        | Discount form visible | 1 Enter new discount 2 Save | Success toast; new value persists             | Validate numeric boundaries |        |

---

## 13. Utilities / UI Behavior

| ID      | Title                       | Priority | Preconditions    | Steps                                        | Expected Result                                              | Notes                          | Status |
| ------- | --------------------------- | -------- | ---------------- | -------------------------------------------- | ------------------------------------------------------------ | ------------------------------ | ------ |
| UTL-001 | Pagination Ellipsis Start   | L        | Many list pages  | 1 Navigate to page 2                         | Page numbers match pattern [1,2,3,4,5,...,N]                 | Compare to generatePageNumbers |        |
| UTL-002 | Pagination Ellipsis Middle  | L        | Many list pages  | 1 Navigate to middle page                    | Ellipses on both sides per logic                             |                                |        |
| UTL-003 | Theme Toggle (Dark/Light)   | L        | Logged in        | 1 Toggle theme                               | Body class updates; preference persists after reload         |                                |        |
| UTL-004 | Responsive Sidebar Collapse | M        | Desktop & mobile | 1 Resize to mobile 2 Open sidebar 3 Navigate | Sidebar auto collapses on route change (if design specified) |                                |        |

---

## 14. Accessibility & UX

| ID       | Title                           | Priority | Preconditions             | Steps                        | Expected Result                                                 | Notes | Status |
| -------- | ------------------------------- | -------- | ------------------------- | ---------------------------- | --------------------------------------------------------------- | ----- | ------ |
| A11Y-001 | Keyboard Navigation (Auth Page) | M        | Not logged in             | 1 Tab through inputs/buttons | Logical tab order; visible focus outline                        |       |        |
| A11Y-002 | Form Error Announcements        | M        | Trigger validation errors | 1 Submit blank form          | Errors visually distinct & announced (aria-live if implemented) |       |        |
| A11Y-003 | Color Contrast (Dashboard KPIs) | L        | Dashboard loaded          | 1 Inspect via dev tools      | Contrast ratio >= WCAG AA                                       |       |        |

---

## 15. Error Handling & Recovery

| ID      | Title                          | Priority | Preconditions           | Steps                          | Expected Result                                                     | Notes                         | Status |
| ------- | ------------------------------ | -------- | ----------------------- | ------------------------------ | ------------------------------------------------------------------- | ----------------------------- | ------ |
| ERR-001 | Network Failure (Deal Create)  | H        | Simulate offline        | 1 Create deal offline 2 Submit | Error toast; no stale partial state                                 | Retry after reconnect works   |        |
| ERR-002 | 401 Expired Token              | H        | Manipulate token expiry | 1 Perform API call             | Redirect or force logout (as designed)                              | Ensure sensitive data cleared |        |
| ERR-003 | 500 Server Error (Events List) | M        | Force 500               | 1 Load Events                  | Error boundary / toast shown; retry button visible (if implemented) |                               |        |

---

## 16. Performance Smoke

| ID       | Title                       | Priority | Preconditions      | Steps                                    | Expected Result                                | Notes                    | Status |
| -------- | --------------------------- | -------- | ------------------ | ---------------------------------------- | ---------------------------------------------- | ------------------------ | ------ |
| PERF-001 | Dashboard Initial Load Time | M        | Warm cache cleared | 1 Log in → measure load until KPIs ready | Within acceptable threshold (<3s on broadband) | Use DevTools Performance |        |
| PERF-002 | Deals List Pagination Speed | L        | Many deals         | 1 Navigate between pages                 | Each page renders <1s perceived                |                          |        |

---

## 17. Security & Data Integrity (Manual Checks)

| ID      | Title                                    | Priority | Preconditions          | Steps                             | Expected Result                            | Notes                         | Status |
| ------- | ---------------------------------------- | -------- | ---------------------- | --------------------------------- | ------------------------------------------ | ----------------------------- | ------ |
| SEC-001 | Direct Access Protected Route (No Token) | H        | Logged out             | 1 Enter /dashboard route manually | Redirect to /signin                        |                               |        |
| SEC-002 | Role-Based Access (If Roles Implemented) | M        | User with limited role | 1 Attempt restricted action       | Action blocked; proper message             |                               |        |
| SEC-003 | Input Sanitization (Deal Title)          | M        | Logged in              | 1 Enter HTML/JS in title 2 Save   | Escaped content shown; no script execution | Use <script>alert(1)</script> |        |

---

## 18. Regression Checklist (Quick Pass Before Release)

| Area         | Checks                          |
| ------------ | ------------------------------- |
| Auth         | Signin, logout, forgot password |
| Deals        | Create, list refresh, delete    |
| Events       | Create, flyer generation        |
| Reservations | List loads & detail view        |
| Reviews      | Toggle display, add comment     |
| Offerings    | Add category + item             |
| Analytics    | Dashboard KPIs render           |
| Media        | Upload & delete                 |
| Theme        | Toggle persists                 |
| Pagination   | Ellipsis logic intact           |

---

## 19. Execution Tracking Template

Paste per cycle:

```
Cycle: YYYY-MM-DD
Executor: NAME
Environment: (Local / Staging / Production Sandbox)
Summary: <overall result>
Blocked Cases: <list>
Defects Logged: <IDs>
```

---

## 20. Future Enhancements

- Add column for Automation Coverage mapping (Y/N / Planned).
- Link to defect tracker automatically via script.
- Integrate Lighthouse performance budget results.

---

**End of Manual Test Case Suite**
