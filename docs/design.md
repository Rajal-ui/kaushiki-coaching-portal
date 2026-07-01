# Design Requirements: Kaushiki Classes Platform

**Version:** 1.0
**Type:** Design System & UI Specification
**Reference Images:** Extej Dashboard (dark crypto), Hexagon EdTech Landing (light pink), Eductix (green EdTech full-page), Mobile EdTech App (purple/pink), EduNova AI ERP (light blue teacher dashboard)
**Companion Docs:** PRD v1.0, TRD v1.0, Implementation Plan v1.0

---

## 0. Design Brief

**Subject:** Kaushiki Classes — an in-center tutoring institution in Pune offering K-12 and CA exam prep in small batches. Tagline: "Learn. Grow. Excel."

**Audiences:**
- **Public (students/parents):** Trust-first, warm, confidence-building. Parents in Pune's middle-class residential neighborhoods deciding where to enroll their child. They respond to clarity, proof, and personal attention signals — not flashy tech aesthetics.
- **Authenticated (student/parent portal):** Clean utility. Progress at a glance. No overwhelm.
- **Admin/Faculty (internal):** Dense data, fast action. Similar to EduNova AI reference (Image 5).

**Design mandate:** Distinctly Kaushiki — not a generic EdTech clone. The brand's real differentiator is *personal* education (small batches, individual attention, doubt-clearing) so the design must feel warm and human, not corporate-SaaS or startup-flashy. One risk taken: use a hand-crafted ink-brush accent element in the hero (like a teacher's chalk underline) — justification: it grounds the brand in classroom physicality, not screen-first learning.

---

## 1. Brand Color Palette

Derived from Kaushiki flyer (orange/dark brown/white) + EdTech reference warmth. Not the generic terracotta-cream-serif default.

| Token Name | Hex | Role |
|---|---|---|
| `--color-primary` | `#E8600A` | Main CTA, active states, key highlights — matches flyer's orange |
| `--color-primary-light` | `#FF8C42` | Hover states, soft backgrounds, progress fill |
| `--color-primary-subtle` | `#FFF3EC` | Section backgrounds, card tints behind primary content |
| `--color-dark` | `#1A1208` | Headings, nav text — warm near-black (not pure #000, warmer) |
| `--color-body` | `#3D3020` | Body text — warm dark brown, not grey |
| `--color-muted` | `#8C7B6B` | Labels, metadata, secondary text |
| `--color-surface` | `#FFFFFF` | Card backgrounds |
| `--color-bg` | `#FAFAF8` | Page background — warm off-white (avoids cold sterile white) |
| `--color-border` | `#EDE8E0` | Dividers, card borders — warm grey |
| `--color-success` | `#2E7D32` | Enrollment confirmed, payment success, attendance present |
| `--color-error` | `#C62828` | Payment failed, validation errors |
| `--color-warning` | `#E65100` | Batch near-capacity warning, fee due soon |
| `--color-info` | `#1565C0` | Informational badges (board type: CBSE/ICSE/State) |

**Dashboard-specific (Admin/Faculty — denser, data-forward):**

| Token Name | Hex | Role |
|---|---|---|
| `--dash-bg` | `#F5F4F2` | Dashboard page background (slightly darker than public bg) |
| `--dash-sidebar` | `#1A1208` | Sidebar background (dark, like Extej Image 1 sidebar) |
| `--dash-sidebar-text` | `#C8BFB0` | Inactive sidebar links |
| `--dash-sidebar-active` | `#E8600A` | Active sidebar item (orange pill, matches flyer) |
| `--dash-card` | `#FFFFFF` | Dashboard card surface |
| `--dash-card-hover` | `#FFF8F4` | Card hover state |

---

## 2. Typography

### 2.1 Type Stack

**Display face:** `Plus Jakarta Sans` (Google Fonts, free)
- Rationale: Confident, contemporary, slightly rounded — feels modern without being cold. Used in Image 2 (Hexagon) with similar energy. Not Inter (overused), not Poppins (generic EdTech default).
- Roles: Hero headline, track/program names, dashboard section titles
- Weights used: 700 (hero), 600 (section heads), 500 (card titles)

**Body face:** `DM Sans` (Google Fonts, free)
- Rationale: Clean, highly legible at small sizes, pairs well with Plus Jakarta Sans without competing. Different enough from the display face to create rhythm.
- Roles: Body copy, form labels, table data, button text
- Weights used: 400 (body), 500 (labels/buttons)

**Utility/Data face:** `JetBrains Mono` (Google Fonts, free)
- Rationale: Used **only** for numeric data in dashboards — fee amounts, test scores, batch capacity numbers. Monospace alignment makes data scannable (learned from Extej Image 1's financial data display).
- Roles: Fee amounts, scores, enrollment counts, attendance percentages

### 2.2 Type Scale

```
--text-xs:    0.75rem  / 12px  — metadata, timestamps, badge labels
--text-sm:    0.875rem / 14px  — secondary body, table data, form helpers
--text-base:  1rem     / 16px  — primary body copy
--text-lg:    1.125rem / 18px  — card titles, form section headers
--text-xl:    1.25rem  / 20px  — sub-section headings
--text-2xl:   1.5rem   / 24px  — section headings, dashboard panel titles
--text-3xl:   1.875rem / 30px  — page titles, program track names
--text-4xl:   2.25rem  / 36px  — hero sub-headline
--text-5xl:   3rem     / 48px  — hero primary headline (desktop)
--text-6xl:   3.75rem  / 60px  — hero headline variant (large screens)
```

### 2.3 Line Heights & Letter Spacing

```
Display text (2xl+): line-height: 1.15, letter-spacing: -0.02em   (tight, confident)
Body text:           line-height: 1.65, letter-spacing: 0           (comfortable reading)
UI labels/buttons:   line-height: 1.2,  letter-spacing: 0.01em     (crisp)
Mono/data:           line-height: 1.4,  letter-spacing: 0           (tabular alignment)
```

---

## 3. Spacing System

8-point grid. All spacing values multiples of 4px.

```
--space-1:   4px    — micro gaps (icon-to-label, badge padding)
--space-2:   8px    — tight component internal padding
--space-3:   12px   — compact list item padding
--space-4:   16px   — standard card padding (mobile), form field gap
--space-5:   20px   — form section gap
--space-6:   24px   — standard card padding (desktop), section internal gap
--space-8:   32px   — card-to-card gap, section padding
--space-10:  40px   — section top/bottom padding (compact)
--space-12:  48px   — section top/bottom padding (standard)
--space-16:  64px   — section top/bottom padding (generous)
--space-20:  80px   — hero vertical padding
--space-24:  96px   — major section separation
```

---

## 4. Border Radius

Friendly, not corporate-sharp; not bubble-soft (Kaushiki is professional, not a gaming app).

```
--radius-sm:   4px   — table row hover, small badges
--radius-md:   8px   — form inputs, small cards, buttons
--radius-lg:   12px  — standard cards (program cards, dashboard widgets)
--radius-xl:   16px  — feature cards, hero image container
--radius-2xl:  24px  — banner/promo blocks (like flyer's rounded program cards)
--radius-full: 9999px — pill badges, avatar, OTP input circles
```

---

## 5. Shadows & Elevation

Warm-tinted shadows (not cold grey) — consistent with warm color palette.

```
--shadow-xs:   0 1px 2px rgba(26, 18, 8, 0.06)                          — subtle lift (nav items)
--shadow-sm:   0 2px 8px rgba(26, 18, 8, 0.08)                          — default card
--shadow-md:   0 4px 16px rgba(26, 18, 8, 0.10)                         — hover card, modal backdrop
--shadow-lg:   0 8px 32px rgba(26, 18, 8, 0.12)                         — floating elements, dropdowns
--shadow-xl:   0 16px 48px rgba(232, 96, 10, 0.15)                      — CTA button hover, hero element
--shadow-focus: 0 0 0 3px rgba(232, 96, 10, 0.25)                       — keyboard focus ring (accessibility)
```

---

## 6. Component Specifications

### 6.1 Buttons

**Primary CTA** (enroll, pay, submit inquiry):
```
Background: --color-primary (#E8600A)
Text: white, DM Sans 500, 15px, letter-spacing 0.01em
Padding: 12px 24px
Border-radius: --radius-md (8px)
Hover: background lighten 8%, translateY(-1px), shadow-xl
Active: translateY(0), shadow-sm
Disabled: opacity 0.45, cursor not-allowed
Min-width: 120px (prevents layout shift on loading state)
Loading state: spinner replaces text (not "Loading..." text — spinner only, preserve button width)
```

**Secondary** (view details, cancel):
```
Background: transparent
Border: 1.5px solid --color-primary
Text: --color-primary, same specs as primary
Hover: background --color-primary-subtle
```

**Destructive** (revoke enrollment, refund):
```
Background: transparent
Border: 1.5px solid --color-error
Text: --color-error
Hover: background #FFEBEE
```

**Ghost** (table row actions — edit, view):
```
Background: transparent
Text: --color-muted
Hover: background --color-border, text --color-dark
```

**Sizes:**
```
sm: padding 8px 16px, text-sm   — table actions, badge-adjacent
md: padding 12px 24px, text-base — default
lg: padding 16px 32px, text-lg  — hero CTA, primary page action
```

### 6.2 Form Inputs

Reference: Eductix (Image 3) clean form fields + EduNova (Image 5) search bar.

```
Height: 48px (touch-target compliant — parents on mobile)
Background: white
Border: 1.5px solid --color-border
Border-radius: --radius-md
Padding: 12px 16px
Font: DM Sans 400, text-base
Color: --color-dark

Focus:
  Border: 1.5px solid --color-primary
  Box-shadow: --shadow-focus
  Outline: none

Error state:
  Border: 1.5px solid --color-error
  Below: error message in text-sm, --color-error, DM Sans 400
  Icon: ⚠ inline-end of input

Valid state:
  Border: 1.5px solid --color-success
  Icon: ✓ inline-end of input

Placeholder: --color-muted, DM Sans 400

Label:
  Position: above input (not placeholder-as-label — accessibility)
  Font: DM Sans 500, text-sm, --color-body
  Gap to input: --space-2

Helper text (below input):
  Font: DM Sans 400, text-xs, --color-muted
```

**OTP Input (phone verification — 6 circles):**
```
6 individual inputs, width 48px × height 56px each
Border-radius: --radius-md
Gap between: --space-3
Active/filled: border --color-primary, background --color-primary-subtle
Font: Plus Jakarta Sans 700, text-2xl, --color-dark, centered
Auto-advance focus on digit entry
```

**Phone input (with +91 prefix):**
```
Left section: "+91" prefix in --color-muted, DM Sans 500
Separator: vertical 1px --color-border
Right section: 10-digit input
Combined border-radius: --radius-md (unified pill)
```

### 6.3 Cards

**Program Track Card (public Programs page):**
```
Background: white
Border: 1px solid --color-border
Border-radius: --radius-xl
Padding: --space-8 (32px)
Shadow: --shadow-sm

Top accent bar: 4px height, --color-primary, border-radius top-only
Track name: Plus Jakarta Sans 600, text-2xl, --color-dark
Subject list: DM Sans 400, text-sm, --color-body, bullet with --color-primary dot
Board badge (CBSE/ICSE/State): pill, background --color-info-light, text --color-info, text-xs
Capacity indicator (if batch open): "X seats available" in text-sm, --color-success
"Inquire Now" button: full-width, secondary variant, at card bottom

Hover:
  Transform: translateY(-3px)
  Shadow: --shadow-md
  Top accent: background --color-primary-light
  Transition: all 200ms ease
```

**Dashboard Summary Card (Admin/Faculty):**
Reference: EduNova Image 5 summary cards (Today's Classes, Student Count etc.)
```
Background: white
Border-radius: --radius-lg
Padding: --space-6 (24px)
Shadow: --shadow-sm

Layout: 2-column inside (label+value left, icon right)
Label: DM Sans 400, text-sm, --color-muted
Value: Plus Jakarta Sans 700, text-3xl, --color-dark (JetBrains Mono for numeric values)
Sub-label: DM Sans 400, text-xs, --color-muted (e.g. "Across 4 batches")
Icon container: 40×40px, --color-primary-subtle background, --radius-md, icon --color-primary
Sparkline (optional): 40px height, right-aligned, --color-primary-light line
```

**Batch Card (Student dashboard — enrolled batches):**
```
Background: white
Border-left: 3px solid --color-primary
Border-radius: 0 --radius-lg --radius-lg 0
Padding: --space-6
Shadow: --shadow-xs

Top: Subject name (Plus Jakarta Sans 600, text-lg) + Track badge (pill)
Middle: Faculty name (DM Sans 400, text-sm, --color-muted) + Schedule (DM Sans 500, text-sm)
Bottom: Attendance % bar + "X% attended" label + "Ask Doubt" ghost button
```

**Test Score Card:**
```
Background: white
Border-radius: --radius-lg
Padding: --space-4 --space-6

Score display: JetBrains Mono 700, text-3xl, --color-primary
Max score: DM Sans 400, text-sm, --color-muted ("/ 100")
Test name: DM Sans 500, text-base
Date: DM Sans 400, text-xs, --color-muted
Faculty remark (if any): italic, DM Sans 400, text-sm, --color-muted, below divider
```

### 6.4 Navigation

**Public Header:**
Reference: Hexagon (Image 2) — clean, horizontal, minimal.
```
Background: white
Border-bottom: 1px solid --color-border
Height: 64px
Sticky: yes (scrolls with page, not fixed — avoids covering content on mobile)

Left: KLN logo mark (small) + "Kaushiki Classes" (Plus Jakarta Sans 700, text-xl, --color-dark)
Center: nav links — Home, Programs, Contact (DM Sans 500, text-sm, --color-body)
  Active: --color-primary, underline 2px --color-primary offset 4px
  Hover: --color-primary
Right: "Login" ghost button + "Inquire Now" primary button (lg size)

Mobile (< 768px):
  Hamburger menu (3 lines → X animation on open)
  Full-screen overlay nav, links stack vertically, large touch targets (48px height each)
  "Inquire Now" at bottom of overlay, full-width
```

**Dashboard Sidebar:**
Reference: Extej (Image 1) dark sidebar + EduNova (Image 5) organized nav groups.
```
Width: 240px (desktop), collapsible to 64px (icon-only mode)
Background: --dash-sidebar (#1A1208)
Border-right: none (shadow separates)

Logo area: 64px height, KLN mark white, "Kaushiki" text white Plus Jakarta Sans 700
Collapse toggle: arrow icon, right-aligned, top of sidebar

Nav groups:
  GROUP LABEL: DM Sans 500, text-xs, --color-muted (uppercased), --space-6 padding-top
  Nav item: 44px height, --space-4 horizontal padding, --radius-md
    Icon: 20×20, --dash-sidebar-text (inactive)
    Label: DM Sans 400, text-sm, --dash-sidebar-text
    Hover: background rgba(255,255,255,0.06)
    Active: background --dash-sidebar-active (#E8600A), icon+text white, Plus Jakarta Sans 500

Nav groups per role:
  STUDENT: My Batches, Test Scores, Attendance, Fee Status, Ask a Doubt
  PARENT: My Children, Test Scores, Attendance, Fee Status, Doubt Queries
  FACULTY: My Batches, Attendance Entry, Test Scores Entry, Doubt Inbox
  ADMIN: Inquiries, Batches, Enrollments, Fees & Payments, Faculty, SMS Logs, Settings

Bottom of sidebar:
  User avatar + name + role (small, --color-muted)
  Logout link
```

### 6.5 Data Tables

Reference: Extej (Image 1) wallet table + EduNova (Image 5) clean white tables.
```
Background: white
Border-radius: --radius-lg
Shadow: --shadow-sm
Overflow: hidden (so radius clips correctly)

Header row:
  Background: --color-bg (#FAFAF8)
  Border-bottom: 1px solid --color-border
  Cell: DM Sans 500, text-xs, --color-muted, uppercase, letter-spacing 0.05em
  Sortable column: sort icon inline, hover shows direction

Data row:
  Height: 56px
  Border-bottom: 1px solid --color-border (last row: none)
  Hover: background --color-primary-subtle
  Cell: DM Sans 400, text-sm, --color-body
  Numeric cells: JetBrains Mono 400, text-sm, right-aligned

Status badges (inline in table cells):
  NEW inquiry:      background #E8F5E9, text #2E7D32 (green)
  CONTACTED:        background #E3F2FD, text #1565C0 (blue)
  ENROLLED:         background #FFF3EC, text #E8600A (orange)
  CLOSED:           background #F5F5F5, text #757575 (grey)
  ACTIVE enrollment: same as ENROLLED
  PENDING payment:  background #FFF9C4, text #F57F17 (amber)
  SUCCEEDED:        background #E8F5E9, text #2E7D32
  FAILED:           background #FFEBEE, text #C62828
  REFUNDED:         background #F3E5F5, text #6A1B9A

Action buttons in table (rightmost column):
  Ghost variant, sm size, --radius-sm
  Max 3 actions visible; overflow into "⋯" dropdown if more
```

### 6.6 Progress Bars (Attendance %, Batch Capacity, Test Trend)

```
Track height: 6px
Track background: --color-border
Track border-radius: --radius-full

Fill:
  Attendance ≥ 75%: --color-success
  Attendance 50-74%: --color-warning
  Attendance < 50%:  --color-error

Batch capacity fill: --color-primary
  ≥ 90% full: --color-error (urgent visual signal)
  75-89%:     --color-warning
  < 75%:      --color-primary

Animation: width transition 600ms ease-out on mount (not on every re-render)
```

### 6.7 Batch Capacity Indicator (unique component — enforces "small batch" brand promise visually)

```
Layout: seats taken / total seats (e.g. "12/15")
Font: JetBrains Mono 700 for numbers, DM Sans 400 for "/" separator
Progress bar below (6.6 above)
Color: transitions per thresholds above

"Full" state:
  Badge: "Batch Full" pill, --color-error background, white text
  Progress bar: fully filled, --color-error
  Enroll button: disabled, "Join Waitlist" ghost button replaces it
```

### 6.8 Subject/Track Badges

```
Each track has a distinct color system (not all --color-primary):
  Classes 1-5:           bg #FFF3EC, text #E8600A (orange — primary brand)
  Classes 6-10:          bg #E8F5E9, text #2E7D32 (green — growth)
  Classes 11-12 Commerce: bg #E3F2FD, text #1565C0 (blue — business/finance)
  CA Foundation/Prep:    bg #F3E5F5, text #6A1B9A (purple — professional/serious)

Pill shape: --radius-full
Padding: 4px 10px
Font: DM Sans 500, text-xs
```

### 6.9 Modals

```
Overlay: rgba(26, 18, 8, 0.6), backdrop-blur: 4px
Modal container:
  Background: white
  Border-radius: --radius-2xl
  Max-width: 480px (forms), 640px (data views)
  Padding: --space-8
  Shadow: --shadow-xl

Header: Plus Jakarta Sans 600, text-xl + close X button (top-right)
Footer: action buttons right-aligned (primary + ghost cancel)
Scroll: content scrolls inside, header+footer sticky within modal
Animation: scale(0.95)→scale(1) + opacity 0→1, 200ms ease-out
```

### 6.10 Toast Notifications

Reference: Image 4 mobile app "Congratulations" bubble + EduNova Image 5 notifications.
```
Position: top-right, --space-6 inset
Width: 320px
Border-radius: --radius-lg
Shadow: --shadow-lg
Padding: --space-4 --space-5

Variants:
  Success: left border 4px --color-success, icon ✓ in --color-success
  Error:   left border 4px --color-error, icon ✗ in --color-error
  Info:    left border 4px --color-info, icon ℹ in --color-info
  Warning: left border 4px --color-warning, icon ⚠ in --color-warning

Title: DM Sans 500, text-sm, --color-dark
Body: DM Sans 400, text-xs, --color-muted
Auto-dismiss: 4s (success/info), manual dismiss (error)
Animation: slide-in from right 250ms ease-out, slide-out 200ms ease-in
Stack: max 3 visible, older ones compress upward
```

---

## 7. Page-Specific Design Specifications

### 7.1 Home Page (Public)

**Layout structure (top to bottom):**

```
┌─────────────────────────────────────────┐
│  HEADER (sticky, 64px)                  │
├─────────────────────────────────────────┤
│  HERO SECTION                           │
│  Left: headline + tagline + CTA         │
│  Right: student photo + floating cards  │
│  Background: --color-bg                 │
├─────────────────────────────────────────┤
│  ADMISSIONS BANNER (full-width strip)   │
│  Background: --color-primary            │
│  "Admissions Open 2026-27" + CTA        │
├─────────────────────────────────────────┤
│  6 PILLARS SECTION                      │
│  3×2 grid of icon + title + desc cards  │
│  Background: white                      │
├─────────────────────────────────────────┤
│  PROGRAMS PREVIEW (4 track cards)       │
│  Background: --color-bg                 │
├─────────────────────────────────────────┤
│  WHY PARENTS TRUST US                   │
│  5 trust factors in horizontal strip    │
│  Background: --color-dark (inverse)     │
├─────────────────────────────────────────┤
│  CONTACT / LOCATION                     │
│  Address + phone + inquiry CTA          │
├─────────────────────────────────────────┤
│  FOOTER                                 │
└─────────────────────────────────────────┘
```

**Hero section detail:**
- Headline: "Learn. Grow. Excel." — Plus Jakarta Sans 700, --text-5xl (desktop), --text-3xl (mobile), --color-dark
- "Learn." in --color-dark, "Grow." in --color-primary, "Excel." with chalk-underline SVG (the signature element — handwritten brush stroke in --color-primary drawn via CSS animation on page load: stroke-dasharray animation, 600ms, once only)
- Sub-headline: "Small batches. Individual attention. Real results." — DM Sans 400, text-xl, --color-muted
- Primary CTA: "Inquire About Admissions" — primary button, lg size
- Secondary CTA: "View Our Programs" — ghost/secondary, lg size
- Hero right: illustration or real student photo (circular crop, --radius-full, --shadow-xl) with 2 floating "social proof" cards:
  - Card 1 (top-right): "✓ Admissions Open — 2026-27" — white card, --shadow-md, --radius-lg, animated entrance
  - Card 2 (bottom-left of image): "15+ Batches Active" — same style
- Mobile: image hidden, text + CTAs stacked full-width

**6 Pillars section:**
- Section eyebrow (above heading): "HOW WE TEACH" — DM Sans 500, text-xs, --color-primary, letter-spacing 0.1em
- Section heading: "Comprehensive Learning For Every Stage" — Plus Jakarta Sans 600, text-3xl
- Grid: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Each pillar card: icon (custom SVG, --color-primary, 32px) + title (Plus Jakarta Sans 600, text-lg) + 1-line description (DM Sans 400, text-sm, --color-muted)
- Icons: Concept=lightbulb, Tests=checklist, Individual Attention=person-focus, Performance=chart-up, Doubt Clearing=speech-bubble-question, Result Oriented=trophy

**Why Parents Trust Us strip:**
```
Background: --color-dark
5 items horizontal (scrollable on mobile): icon ✓ + label
Font: DM Sans 500, text-sm, white
Icon: --color-primary
Items: Experienced & Caring Faculty | Small Batch Size | Disciplined & Supportive Environment | Personalised Attention | Regular Parent Feedback
```

### 7.2 Programs Page (Public)

```
Page header: "Our Programs" + sub "Choose the right track for your child's academic stage"
4 track cards: 2×2 grid (desktop), 1 column (mobile)
Each card: per Section 6.3 spec above
Clicking card: expands (accordion-style) to show subject list + batch availability count + CTA
  OR routes to /programs/[track-slug] detail page (preferred — better SEO)
```

**Track detail page layout:**
```
Hero: track name + badge + board coverage tag + "X batches available" count
Subjects covered: tag cloud of subjects (colored pills per 6.8)
Programs content: subject → batch table (schedule, faculty name, capacity bar, Enroll/Inquire)
Sidebar (desktop): Inquiry form pre-filled with this track
```

### 7.3 Contact Page (Public)

```
2-column layout (desktop): Form left, contact info right
Form: per Section 6.2 spec
  Fields: Name, Phone (+91 prefix input), Email (optional), Track interest dropdown, Message
  Submit: primary button lg "Send Inquiry"
  Success state: form replaced with "✓ We've received your inquiry. We'll call you shortly." card

Contact info (right column):
  Phone: displayed large (JetBrains Mono 700, text-3xl, --color-primary) — clickable tel: link
  Email: standard text link
  Address: with map embed (Google Maps iframe, --radius-xl clip)
  Hours: "Mon–Sat, 9 AM – 7 PM"
```

### 7.4 Student Dashboard

Reference: Image 4 (mobile app class schedule) + Image 5 (EduNova summary cards)

```
Layout: sidebar (240px) + main content area
Page title: "Good morning, [Name]" — Plus Jakarta Sans 600, text-2xl

Summary row (top):
  4 cards: Active Batches | Next Class | Attendance (overall %) | Doubts Pending
  Each per Section 6.3 Dashboard Summary Card spec

Main content tabs: My Batches | Test Scores | Attendance | Doubt Queries | Fee Status

My Batches tab:
  List of Batch cards (per 6.3 Batch Card spec)
  Each: Subject, Track badge, Faculty, Schedule, Attendance bar, "Ask Doubt" action

Test Scores tab:
  Filter: by subject (dropdown) + by date range
  Score cards grid (per 6.3 Test Score Card spec)
  Line chart: score trend over time per subject (recharts or Chart.js)
    X: test dates, Y: score %, colors per subject using 6.8 track color system

Attendance tab:
  Per batch: progress bar + "X/Y sessions attended"
  Calendar heatmap view (month grid, green/grey per day — shows pattern at a glance)
  Reference: Image 4 class schedule calendar for layout inspiration

Doubt Queries tab:
  "Ask a Doubt" CTA button (primary, top-right)
  List: question text (truncated), subject badge, status (OPEN/ANSWERED), date submitted
  Clicking row: expands thread (question + attachment + faculty response)

Fee Status tab:
  Status card: "Fees Paid ✓" or "Fee Due: ₹X by [date]" with pay-now CTA
  Payment history table: date, batch, amount (JetBrains Mono), status badge, receipt download
```

### 7.5 Admin Dashboard

Reference: EduNova AI Image 5 (primary layout model) + Extej Image 1 (dark sidebar)

```
Left sidebar: --dash-sidebar dark, per 6.4 nav spec
Main area: --dash-bg (#F5F4F2)
Top bar: search, notification bell, admin avatar + name

Page: Inquiries
  Summary: NEW (count), CONTACTED, ENROLLED, CLOSED — 4 stat cards
  Table: per 6.5 spec, columns: Name | Phone | Track | Status | Assignee | Date | Actions
  Actions per row: Mark Contacted | Assign | Mark Enrolled | Close
  Filters: by status, by track, by date range, by assignee
  Bulk actions: select multiple → assign, change status

Page: Batches
  Summary: Active Batches | Total Enrolled | Batches at Capacity | Upcoming New Batches
  Table: Track | Subject | Faculty | Seats (X/Y with progress bar) | Schedule | Status | Edit
  "Create Batch" button: opens modal per 6.9 spec

Page: Fees & Payments
  Summary cards: This Month Collection (JetBrains Mono, large) | Pending | Failed | Refunded
  Table: Student | Batch | Amount | Gateway Ref | Status badge | Date | Refund action
  Filter: by status, date range

Page: SMS Logs
  Table: Recipient phone | Trigger event | Template | Status | Sent at | Retry count | Retry action
  Status badge: QUEUED (amber) | SENT (blue) | DELIVERED (green) | FAILED (red)

Page: Settings
  Sections: Admissions Cycle (text input — "2026-27") | Contact Details | Fee Structure | SMS Templates
  Each section: card container, edit-in-place or modal edit
```

### 7.6 Faculty Dashboard

```
Summary: My Batches count | Today's Classes | Pending Doubts | Scores to Enter
My Batches: batch cards with roster-count and today's schedule highlight
Attendance Entry:
  Batch selector → date picker → roster list with Present/Absent toggle per student
  Bulk "Mark All Present" action
  Save button: primary, "Save Attendance" (active voice per design principles)
Test Score Entry:
  Batch selector → "New Test" button → modal: test name + date → score entry grid
  Grid: student name | score input (number field) | max score (pre-filled from test) | remark (optional)
Doubt Inbox:
  Cards: student name | subject badge | question preview | date | "Reply" action
  Reply: inline expand (not modal) — shows full question, optional attachment thumbnail, text area for response
  "Mark Answered" button finalizes
```

---

## 8. Responsive Breakpoints

```
xs:  < 480px   — small mobile (OTP inputs, compact nav)
sm:  480–767px — mobile (single column everything)
md:  768–1023px — tablet (2-column grids, sidebar collapses to icon-only)
lg:  1024–1279px — desktop (full layout, 240px sidebar)
xl:  1280–1535px — large desktop (wider content area)
2xl: ≥ 1536px  — extra-wide (max content-width: 1280px, centered)
```

**Mobile-first critical rules:**
- Touch targets: minimum 44×44px for all interactive elements
- Bottom navigation on mobile dashboards (5 icons, replaces sidebar) — reference Image 4 mobile bottom nav
- Form inputs: height 48px minimum on mobile (no pinch-to-zoom on iOS)
- Tables: horizontal scroll on mobile with sticky first column (student/subject name)
- Cards: full-width on mobile (no gaps)

---

## 9. Animation & Motion Principles

- **Hero chalk-underline:** SVG stroke-dasharray draw, 600ms ease-in-out, once on page load — the signature brand moment
- **Card hover lifts:** translateY(-3px) + shadow increase, 200ms ease — used on program cards, inquiry cards
- **Dashboard counter counts up:** numeric summary cards count from 0 to value on mount, 800ms ease-out — reference EduNova Image 5 summary cards
- **Progress bar fill:** width 0→value, 600ms ease-out on mount
- **Toast slide-in:** translateX(100%)→0, 250ms ease-out
- **Modal scale:** scale(0.95)→1, opacity 0→1, 200ms ease-out
- **Sidebar collapse:** width 240px→64px, 250ms ease-in-out, labels fade out
- **Tab switch:** content crossfades, 150ms — no sliding (sliding implies spatial relationship, tabs don't have one)
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` → all animations disabled, transitions instant

---

## 10. Accessibility Requirements

- Contrast ratio: all text ≥ 4.5:1 (AA) against background — verify primary orange #E8600A on white (ratio: 3.1:1) — **use on dark backgrounds or use darker shade #C5500A (#C5500A on white = 4.7:1) for text-on-white contexts**
- Focus rings: --shadow-focus on all interactive elements, keyboard navigation fully functional
- ARIA: form inputs labeled (not placeholder-only), modal `role="dialog"` with `aria-modal`, status badges `role="status"`, loading states `aria-busy="true"`
- OTP input: each digit input `aria-label="Digit X of 6"`
- Images: alt text (student photos = "Student at Kaushiki Classes", not "image123.jpg")
- Error messages: `role="alert"` for inline validation errors — screen reader announces immediately
- Tables: `<thead>` + `scope="col"` on headers
- Skip link: "Skip to main content" as first focusable element (public pages)

---

## 11. Iconography

**Library:** Lucide React (open source, consistent stroke weight, MIT license)
**Style:** 20px × 20px standard, 24px for nav items, 16px for badges/inline
**Stroke width:** 1.5px (consistent with DM Sans body weight — visually harmonious)

**Key icon assignments:**
```
Dashboard/Home:     LayoutDashboard
My Batches:         BookOpen
Test Scores:        BarChart2
Attendance:         CalendarCheck
Doubt Queries:      MessageCircleQuestion
Fee Status:         CreditCard
Admin Inquiries:    Inbox
Admin Batches:      Users
Admin Payments:     Banknote
Faculty:            GraduationCap
SMS Logs:           MessageSquare
Settings:           Settings2
Notifications:      Bell
Search:             Search
Enroll/Add:         PlusCircle
Edit:               Pencil
Delete/Revoke:      Trash2
Success:            CheckCircle2
Error:              XCircle
Warning:            AlertTriangle
Info:               Info
```

---

## 12. Loading & Empty States

**Skeleton loaders (preferred over spinners — per Eductix Image 3 pattern):**
```
CSS: background: linear-gradient(90deg, --color-border 25%, --color-bg 50%, --color-border 75%)
Background-size: 200% 100%
Animation: shimmer 1.5s infinite
Border-radius: matches the element being loaded (--radius-lg for card, --radius-sm for text line)

Skeleton anatomy per component:
  Dashboard card: grey bar (heading) + grey bar (value) + small grey bar (sub-label)
  Table row: alternating grey bars per column width
  Batch card: tall rectangle + 2 thin bars + progress bar skeleton
```

**Empty states:**
```
Layout: centered illustration + heading + sub-text + CTA (if applicable)
Illustration: simple SVG (no external dependency) — line-art style, --color-primary accent

Per page:
  No enrollments (Student): "You're not enrolled in any batches yet." + "Browse Programs" primary button
  No test scores yet: "No test results yet — check back after your first test." (no CTA — just informational, not an error)
  No doubt queries: "No questions yet. Ask your first doubt!" + "Ask a Doubt" primary button
  No inquiries (Admin): "No new inquiries — all clear." (positive empty state, no CTA needed)
  No failed SMS (Admin): "No failed messages. All notifications delivered." (explicitly positive)
  Batch full: "This batch is full." + "View other batches" secondary button + optional waitlist form
```

---

## 13. Illustration & Image Guidelines

**Hero photo:**
- Real student photo (licensed or Kaushiki's own) — not stock-photo-obvious
- Or: high-quality illustrated student (vector, warm palette matching brand) if real photo unavailable

**Section illustrations:**
- Simple, warm-toned SVG line illustrations (not isometric 3D — too corporate tech)
- Stick to 2-color max per illustration (--color-primary + --color-dark)
- Hand-sketched feel matches the "chalk-underline" signature element

**Avoid:**
- Blue/purple gradient backgrounds (generic SaaS signal — wrong sector for Kaushiki's parent audience)
- 3D floating blob shapes (overused in EdTech — see Eductix Image 3 overusing this)
- Stock photos of people using laptops in coffee shops (not Kaushiki's in-center reality)
- Confetti/celebration illustrations (trivializes academic achievement for a CA-prep audience)

---

## 14. Copy Tone & Voice

From design principles: copy is design material.

**Public pages:**
- Direct and warm — speaks to parents as much as students
- Active voice: "Enroll your child" not "Enrollment is available"
- Proof over promise: "15 students per batch — by design" not "We believe in small classes"
- Pune-local feel is fine: no need to sound global

**Authenticated portals:**
- Functional, no filler — dashboards are tools, not marketing
- Label actions precisely: "Save Attendance" not "Submit", "Send Reply" not "Submit Response"
- Empty states read as invitations: "Ask your first doubt" not "No data found"
- Error messages explain and direct: "Payment failed — your card was declined. Try a different card or contact your bank." not "An error occurred."

**Critical copy strings (sourced from flyer — do not paraphrase or rebrand):**
- Tagline: "Learn. Grow. Excel." (exact, with periods)
- Tag: "Strong Foundation, Bright Future" (use as hero sub-text or section eyebrow)
- CTA label for admissions: "Inquire About Admissions" (not "Sign Up", not "Get Started")

---

## 15. File & Asset Conventions

```
Component files: PascalCase (BatchCard.tsx, OtpInput.tsx)
CSS/style files: kebab-case matching component (batch-card.module.css if modules used)
Icon imports: named from lucide-react (not index import — tree-shaking)
Image files: kebab-case, descriptive (kaushiki-hero-student.jpg, track-ca-foundation.svg)
Color tokens: CSS custom properties in globals.css (not Tailwind config extend only — need token names for docs)

Tailwind config:
  Extend colors with all --color-* tokens above (so cn() utility can reference them)
  Extend fontFamily: { display: ['Plus Jakarta Sans', 'sans-serif'], body: ['DM Sans', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
  Extend borderRadius with all --radius-* tokens
  Extend boxShadow with all --shadow-* tokens
```

---

## 16. Design–Development Handoff Checklist

Before any component is built, confirm:
- [ ] Tailwind config extended with all tokens from Sections 1–5
- [ ] Google Fonts loaded: Plus Jakarta Sans (500, 600, 700), DM Sans (400, 500), JetBrains Mono (400, 700)
- [ ] CSS custom properties declared in `:root` in `globals.css`
- [ ] Lucide React installed and icon assignments agreed (Section 11)
- [ ] Track badge color system (Section 6.8) as shared constants (`lib/constants/track-colors.ts`)
- [ ] Status badge color system (Section 6.5) as shared constants
- [ ] Empty state SVG illustrations sourced or created before public pages launch
- [ ] Orange on white contrast: use `#C5500A` for text on light backgrounds, `#E8600A` only on dark or subtle backgrounds
- [ ] `@media (prefers-reduced-motion)` block in globals.css covering all animation classes
- [ ] Mobile bottom nav implemented for dashboard on mobile before Student dashboard ships
- [ ] OTP input component built and tested before Auth sprint ships
