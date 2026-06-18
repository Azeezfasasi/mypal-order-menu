# MyPal Business Admin Dashboard – Testing & QA Guide

A comprehensive guide for planning, writing, and maintaining automated tests for this project. This document defines scope, strategy, tooling, conventions, and exemplar test cases mapped to existing functionality.

---

## 1. Testing Goals

- Safeguard critical business workflows (auth, KYB, deals, events, reservations, menus, reviews, revenue analytics)
- Enable confident refactors (React 19 / Next.js 15 / App Router + Turbopack)
- Provide fast local feedback (unit + integration) and realistic user flow coverage (E2E)
- Ensure API contract stability (MSW / contract tests)
- Maintain accessibility & data integrity standards

---

## 2. Recommended Tooling

| Layer                  | Purpose                                                    | Suggested Tools                                                     |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Unit                   | Pure functions & small utilities                           | Jest + ts-jest (or SWC), React Testing Library (RTL) for components |
| Integration            | Components + hooks + data fetching (React Query + Zustand) | RTL + MSW                                                           |
| Contract               | API endpoint shape & transformation utils                  | MSW + schema assertions (Zod if available)                          |
| E2E                    | Full user flows (auth → create deal → verify listing)      | Playwright (preferred) or Cypress                                   |
| Accessibility          | a11y regression                                            | jest-axe (unit/integration) + Playwright a11y snapshots             |
| Performance (optional) | Key pages (dashboard load)                                 | Lighthouse CI / Playwright traces                                   |

### 2.1 Install (proposed dev dependencies)

```
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event whatwg-fetch msw jest-environment-jsdom jest-axe
npm install -D playwright @playwright/test
```

Optionally (faster): `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom msw` instead of Jest.

---

## 3. Directory & Naming Conventions

```
TESTING.md (this file)
/jest.config.js (or vitest.config.ts)
/src/__tests__/ (co-located unit tests allowed)
/tests/
  unit/            -> Pure utilities (e.g., duration-calculator, utils)
  integration/     -> Hooks + components (React Query + Zustand store interaction)
  contract/        -> API service facade tests (msw handlers)
  e2e/             -> Playwright specs
  fixtures/        -> JSON samples & factories
  mocks/           -> msw handlers, test server setup
```

File naming: `*.test.ts` (unit) / `*.spec.tsx` (component) / `*.e2e.ts` (Playwright) / `*.contract.ts` (API contract).

---

## 4. Test Environment Setup (Jest Example)

Example `jest.config.js` (simplified):

```
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};
```

`tests/setup/jest.setup.ts`:

```
import '@testing-library/jest-dom';
import 'whatwg-fetch';
```

MSW server `tests/mocks/server.ts` creates handlers matching endpoints in `src/services/api/endpoints.ts`.

---

## 5. Mocking Strategy

| Area            | Strategy                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| API Calls       | MSW intercepts axios requests (match full path from `ENDPOINTS`)                           |
| Auth Token      | Simulate store state via `useAuthStore.setState({ token: 'x', tokenType: AUTHENTICATED })` |
| React Query     | Wrap with `<QueryClientProvider>` using a fresh client per test                            |
| Date/Time       | Use `jest.setSystemTime(new Date('2025-01-01'))` for deterministic ranges                  |
| File uploads    | Use `new File(['binary'], 'image.jpg', { type: 'image/jpeg' })`                            |
| Toasts (sonner) | Mock module or assert side-effects where needed                                            |

---

## 6. Coverage Targets

| Domain                    | Critical Paths (must have)                                                     |
| ------------------------- | ------------------------------------------------------------------------------ |
| Authentication            | Signin success / failure, OTP verify flow, password reset, logout clears store |
| Auth Store (Zustand)      | Persistence behavior, session update, token type transitions                   |
| Deals                     | Create / Update / Delete invalidates proper React Query keys                   |
| Events                    | Fetch list, generate flyer (happy path + error), date/time derived fields      |
| Duration Utils            | All modes (date only, time only, date+time) + invalid edges                    |
| FormData Builders         | Nested objects, arrays, File handling, skip undefined                          |
| Currency Utils            | Formatting boundaries (k/m conversions)                                        |
| Pagination Utils          | generatePageNumbers for pages <7, near start, middle ellipsis, near end        |
| Reviews                   | Toggle display, add reaction/comment flows                                     |
| Operating & Blackout Days | Create / update / validation collisions                                        |
| Service Offerings         | Create/update category, service item, accommodation, attraction toggle         |
| Reservations              | Buffet reservation creation & payment verify (mock)                            |
| Reports                   | Date range validation (mutual exclusivity)                                     |
| Transaction Settings      | Toggle, update discount/charge                                                 |

Aim: >= 80% statements, 95% critical path functions.

---

## 7. Sample Test Matrices

### 7.1 `calculateDuration` (src/lib/duration-calculator.ts)

| Case                   | Input                               | Expected             |
| ---------------------- | ----------------------------------- | -------------------- |
| Empty                  | all undefined                       | ''                   |
| Date only valid        | 2025-01-01 → 2025-01-02             | '1 Day'              |
| Date only multi        | 2025-01-01 → 2025-01-05             | '4 Days'             |
| Time only hour         | 09:00 AM → 11:00 AM                 | '2 Hours'            |
| Time only hour+min     | 09:15 AM → 11:45 AM                 | '2 Hours 30 Minutes' |
| Time only minute       | 09:00 AM → 09:05 AM                 | '5 Minutes'          |
| Date+Time <1h          | 2025-01-01 09:00 → 2025-01-01 09:10 | '10 Minutes'         |
| Date+Time multi-hour   | 2025-01-01 09:00 → 2025-01-01 11:00 | '2 Hours'            |
| Date+Time day boundary | 2025-01-01 09:00 → 2025-01-02 10:00 | '1 Day 1 Hour'       |
| Invalid (end <= start) | same or reversed                    | ''                   |

### 7.2 Auth Store (src/stores/auth-store.ts)

| Scenario        | Arrange           | Act                                     | Assert                       |
| --------------- | ----------------- | --------------------------------------- | ---------------------------- |
| Set session     | token + business  | actions.setSession                      | token persisted, cookies set |
| Clear session   | existing state    | actions.clearSession                    | token null, business null    |
| Update business | existing business | actions.updateBusiness({ wallet: 500 }) | wallet updated               |
| Hydration flag  | simulate persist  | call hydration hook                     | isLoading false              |

### 7.3 Deals React Query (src/services/api/deals-api.ts)

Test invalidation:

- When creating deal, `DEAL_QUERY_KEYS.list()` & `businessList()` refetched.
- When deleting specific deal, its `detail(id)` invalidated.
  Use spy on `queryClient.invalidateQueries` with expected keys.

### 7.4 Form Data Builders

`createFlatFormDataV2`: ensures File appended raw, numbers coerced to string, skips undefined, includes boolean.
`appendFormDataV2`: arrays produce indexed keys.

### 7.5 `buildRansackQuery`

| Input                                           | Expected Contains      |
| ----------------------------------------------- | ---------------------- |
| q: { name_cont: 'sushi' }, page 1 (1-based UI)  | name_cont=sushi&page=1 |
| inputZeroBased true, page 0, apiZeroBased false | page=1                 |
| inputZeroBased false, page 2, apiZeroBased true | page=1                 |

### 7.6 `generatePageNumbers`

| totalPages | currentPage | Expected                 |
| ---------- | ----------- | ------------------------ |
| 5          | 3           | [1,2,3,4,5]              |
| 10         | 2           | [1,2,3,4,5,'...',10]     |
| 10         | 6           | [1,'...',5,6,7,'...',10] |
| 10         | 9           | [1,'...',6,7,8,9,10]     |

### 7.7 Currency Utils

| amount    | Expected |
| --------- | -------- |
| 0         | ₦0       |
| 950       | ₦950     |
| 1_500     | ₦1k      |
| 2_400_000 | ₦2.4m    |

---

## 8. Example Unit Test Snippets

### 8.1 Duration

```
import { calculateDuration } from '@/lib/duration-calculator';

test('returns 1 Day for adjacent dates', () => {
  expect(calculateDuration('2025-01-01', undefined, '2025-01-02', undefined)).toBe('1 Day');
});
```

### 8.2 Auth Store

```
import { useAuthStore, TokenType } from '@/stores/auth-store';

test('sets and clears session', () => {
  useAuthStore.getState().actions.setSession('abc', TokenType.AUTHENTICATED, { id:'1', email:'a', role:'owner', business_name:null, image_url:null, current_token:'abc' });
  expect(useAuthStore.getState().token).toBe('abc');
  useAuthStore.getState().actions.clearSession();
  expect(useAuthStore.getState().token).toBeNull();
});
```

### 8.3 FormData

```
import { createFlatFormDataV2 } from '@/lib/api-helpers';

test('creates flat form data', () => {
  const fd = createFlatFormDataV2({ name: 'Deal', price: 100, active: true });
  expect([...fd.entries()]).toEqual([
    ['name','Deal'], ['price','100'], ['active','true']
  ]);
});
```

---

## 9. Integration Test Examples

1. Deal Creation Flow
   - Mock POST /deals/create returning deal id.
   - Render form component → fill inputs → submit.
   - Assert toast success, query invalidation triggered (refetch mock).
2. Event Flyering (Generate Flyer)
   - Mock POST /events/generate-flyers with image URL.
   - Assert loading state, then preview displays generated flyer.
3. Review Interaction
   - Mock GET business reviews + POST reaction.
   - Click like → optimistic update count increments.

Wrapper Utility:

```
const renderWithProviders = (ui) => render(
  <QueryClientProvider client={makeTestClient()}>{ui}</QueryClientProvider>
);
```

---

## 10. Contract Testing (API Facades)

Ensure `DealsApi.useCreateDeal` sends multipart body with expected keys.
Use MSW handler capturing `req.formData()` and asserting presence of: deal_title, start_date, benefits[0][description], agendas[0][title]. Fail test if structure diverges (prevents silent backend integration drift).

---

## 11. E2E Test Scenarios (Playwright)

| ID         | Scenario           | Steps                                  | Assertions                               |
| ---------- | ------------------ | -------------------------------------- | ---------------------------------------- |
| AUTH-001   | Successful Signin  | Visit /signin → fill form → submit     | Redirect to /dashboard, token cookie set |
| DEAL-002   | Create Deal        | Login → Navigate Deals → Create → Save | Deal appears in list with title          |
| EVENT-003  | Generate Flyer     | Login → Events → Create Flyer → Submit | Flyer preview image loads                |
| REV-004    | Hide Review        | Login → Reviews → Toggle display       | Badge updates to Hidden                  |
| MENU-005   | Add Service Item   | Login → Offerings → Add Item           | Item row appears                         |
| RES-006    | Buffet Reservation | Login → Reservations → Open detail     | Reservation list populated               |
| REPORT-007 | Revenue Filter     | Dashboard → Change date range          | Chart updates (assert API call count)    |

Playwright Config Suggestion: use project list for desktop + mobile viewport.

---

## 12. Accessibility Testing

- Add jest-axe assertions for primary pages (Dashboard, Deals form, Events creation)

```
import { axe } from 'jest-axe';
const { container } = render(<DealsForm />);
expect(await axe(container)).toHaveNoViolations();
```

- Playwright: `await expect(page).toHaveScreenshot('dashboard-a11y.png')` after forcing prefers-reduced-motion.

---

## 13. Performance & Regression (Optional Enhancements)

- Track bundle changes via `next build --analyze`
- Add Playwright trace for dashboard initial load; assert API waterfalls < threshold.

---

## 14. Data Factories

Create lightweight factories (no external lib needed):

```
export const dealFactory = (overrides={}) => ({
  id: crypto.randomUUID(),
  deal_title: 'Sample Deal',
  location: 'Lagos',
  start_date: '2025-01-01',
  end_date: '2025-01-02',
  start_time: '09:00 AM',
  end_time: '11:00 AM',
  duration: '2 Hours',
  about_deal: 'Promo',
  price: 5000,
  is_eighteen_plus: false,
  refine_description: false,
  benefits: [],
  agendas: [],
  ...overrides,
});
```

Use factories in test fixtures to reduce duplication.

---

## 15. CI Integration (Outline)

1. Install dependencies
2. Lint: `npm run lint`
3. Unit/Integration tests: `npm test -- --coverage`
4. Build app: `npm run build`
5. Start server & run Playwright: `npx playwright test`
6. Upload coverage (Codecov / Coveralls)

Parallelize: Unit tests separate from E2E.

---

## 16. Risk-Based Prioritization

| Risk                                                | Mitigation Test                            |
| --------------------------------------------------- | ------------------------------------------ |
| Incorrect token state leads to unauthorized access  | Auth store + route guard integration tests |
| Deal mutation invalidation fails causing stale data | React Query invalidation test              |
| Time calculations produce wrong durations in UI     | Comprehensive duration util tests          |
| FormData mis-serialization breaks uploads           | Contract tests inspecting FormData         |
| Pagination page ellipsis logic incorrect            | generatePageNumbers cases                  |

---

## 17. Maintenance Guidelines

- Add test alongside new feature PR (red → green → refactor)
- Avoid over-mocking: prefer MSW for realistic network boundaries
- Keep factories updated when backend adds required fields
- Fail fast on unhandled request in MSW (`server.listen({ onUnhandledRequest: 'error' })`)
- Periodically review flaky E2E tests; store Playwright traces on failure

---

## 18. Open Gaps (To Plan)

- No current test framework installed: choose Jest or Vitest
- No snapshot strategy defined (prefer explicit assertions)
- Add contract tests for ALL endpoints touched in `src/services/api/`
- Add visual regression (Chromatic / Playwright screenshots) if UI stabilization needed

---

## 19. Quick Start Checklist

[ ] Install test dependencies
[ ] Add jest / vitest config
[ ] Create MSW handlers for core endpoints (auth, deals, events)
[ ] Implement factories
[ ] Add initial critical path tests (auth store, duration util, deals create)
[ ] Integrate CI workflow pipeline
[ ] Add Playwright config + 1 sample E2E

---

## 20. Appendix – Endpoint Groups to Cover

- Auth: signin, signup, verify otp, reset password, update business
- Deals: create, update, delete, list, upcoming
- Events: list, business upcoming, flyer generation
- Reviews: CRUD, reactions, comments, average rating
- Service Offerings: categories, items, accommodations, attractions toggle
- Operating / Blackout Days: CRUD
- Reservations (buffet / event)
- Media: upload, list, delete
- Reports / Revenue: (if implemented in services folder later)

---

**Adopt incremental testing: begin with utilities + state, move outward to integration + E2E to maximize early ROI.**
