# Development Documentation Index

## Core Documentation Structure

This directory contains development guides for various features of the MyPal Business Admin platform. Documentation is organized by topic area for easy reference and reuse.

---

## General Purpose Guides (Reusable across features)

### 1. **HTML_SANITIZATION_SECURITY_GUIDE.md**

**Purpose:** General guide for safely handling HTML from untrusted sources in any React component

**When to use:**

- Rendering HTML from backend APIs
- Processing user-provided content
- Any feature displaying HTML templates
- Implementing XSS prevention

**Key Sections:**

- 4-layer XSS prevention model
- Input validation strategies
- HTML escaping techniques
- Sanitization configuration
- Security testing patterns
- Common patterns and recipes

**Applicable to:** Contracts, Reports, Notifications, User Content, Dynamic Templates

---

### 2. **PDF_GENERATION_GUIDE.md**

**Purpose:** Comprehensive guide for generating professional PDFs from HTML content in any feature

**When to use:**

- Building PDF export functionality
- Implementing print-to-PDF features
- Creating multi-page documents
- Optimizing PDF file size and quality

**Key Sections:**

- PDF generation architecture
- usePdfDownload hook implementation
- Optimization techniques (page breaking, margins, image quality)
- Layout strategies for multi-page documents
- Performance optimization tips
- Troubleshooting common issues

**Applicable to:** Contracts, Reports, Invoices, Certificates, Statements

---

## Feature-Specific Guides (Implementation details)

### 3. **CONTRACT_IMPLEMENTATION_GUIDE.md**

**Purpose:** Complete implementation guide for the Contract Preview and Management feature

**Includes:**

- Contract modal component setup
- Data flow and architecture
- Placeholder fields mapping
- Styling and layout details
- Hero banner and social icons
- Signed sections display
- PDF export configuration
- Error handling
- Status workflow
- Troubleshooting
- Performance optimization

**References:**

- HTML_SANITIZATION_SECURITY_GUIDE.md (for sanitization details)
- PDF_GENERATION_GUIDE.md (for PDF optimization details)

---

## How to Use This Documentation

### For General Features

If building a new feature that needs HTML rendering or PDF export:

1. **Read the appropriate general guide first:**
   - HTML Sanitization? → `HTML_SANITIZATION_SECURITY_GUIDE.md`
   - PDF Export? → `PDF_GENERATION_GUIDE.md`

2. **Apply the patterns shown in the guide**

3. **Test with provided test cases**

### For Contract Feature

If working on or modifying contracts:

1. **Start with:** `CONTRACT_IMPLEMENTATION_GUIDE.md`

2. **For detailed HTML/security topics:**
   - Jump to `HTML_SANITIZATION_SECURITY_GUIDE.md`

3. **For PDF customization:**
   - Jump to `PDF_GENERATION_GUIDE.md`

### For Adding New Features

When adding a feature that uses similar patterns:

1. **Rendering HTML from API?**

   ```
   Contract Implementation Guide
   ├── References HTML Sanitization Guide
   └── Shows how to apply it to your use case
   ```

2. **Generating PDFs?**
   ```
   Use PDF Generation Guide
   └── Adapt hook and patterns for your feature
   ```

---

## Documentation Map

```
Development Docs
│
├── General Purpose (Reusable)
│   ├── HTML_SANITIZATION_SECURITY_GUIDE.md
│   │   └── 4-layer XSS prevention
│   │   └── Input validation
│   │   └── Testing strategies
│   │
│   └── PDF_GENERATION_GUIDE.md
│       └── PDF hook implementation
│       └── Page breaking
│       └── Optimization
│
└── Feature Implementation
    └── CONTRACT_IMPLEMENTATION_GUIDE.md
        ├── References → HTML_SANITIZATION_SECURITY_GUIDE.md
        └── References → PDF_GENERATION_GUIDE.md
```

---

## Code File Locations

### Contract Feature

```
src/
├── components/dialogs/
│   └── contract-preview-modal.tsx       # Main contract modal UI
├── lib/
│   └── contract-utils.ts                 # Sanitization & processing
├── hooks/
│   └── usePdfDownload.ts                 # PDF generation hook
├── types/
│   └── contract-types.ts                 # TypeScript interfaces
└── services/
    └── contract-service.ts               # API calls
```

---

## Quick Reference

### When You Need...

| Need                 | Document                            | Section                    |
| -------------------- | ----------------------------------- | -------------------------- |
| To sanitize HTML     | HTML_SANITIZATION_SECURITY_GUIDE.md | Security Architecture      |
| XSS prevention       | HTML_SANITIZATION_SECURITY_GUIDE.md | 4-Layer XSS Prevention     |
| HTML escaping        | HTML_SANITIZATION_SECURITY_GUIDE.md | Layer 2: HTML Escaping     |
| To generate PDFs     | PDF_GENERATION_GUIDE.md             | Implementation             |
| Page breaking        | PDF_GENERATION_GUIDE.md             | Page Breaking & Layout     |
| PDF optimization     | PDF_GENERATION_GUIDE.md             | Optimization Techniques    |
| Contract setup       | CONTRACT_IMPLEMENTATION_GUIDE.md    | Implementation Details     |
| Placeholder handling | CONTRACT_IMPLEMENTATION_GUIDE.md    | Placeholder Fields Mapping |
| Status workflow      | CONTRACT_IMPLEMENTATION_GUIDE.md    | Contract Status Workflow   |

---

## Documentation Philosophy

### Goals

- **Reusable:** General guides can be applied to any similar feature
- **Specific:** Feature guides handle concrete implementation
- **Clear:** Code examples provided for all concepts
- **Complete:** References and troubleshooting included
- **Accessible:** Table of contents and quick references

### Structure

- General → Specific (top-down)
- Problem → Solution (practical focus)
- Why → What → How (explanation progression)
- Examples → Testing → Troubleshooting (practical depth)

---

## Contributing to Documentation

When adding new features with similar patterns:

1. **If no general guide exists:** Create one (HTML*SANITIZATION*_, PDF\__, etc.)
2. **Refer back to it:** Link from feature-specific docs
3. **Add test cases:** Include in the general guide
4. **Update this index:** Keep references current

This keeps documentation DRY (Don't Repeat Yourself) and maintainable.

---

## Other Documentation

Other feature documentation in this directory:

- `auth-flow-documentation.md` - Authentication flow
- `axios-notification-implementation.md` - Notification system
- `firebase-refactoring-guide.md` - Firebase integration
- `MOBILE_COMPATIBILITY_FIX.md` - Mobile responsiveness
- And more...

---

## Last Updated

- Created: November 12, 2025
- Consolidated: 3 main documentation files
- Removed: 20+ redundant documents
- Files: HTML_SANITIZATION_SECURITY_GUIDE.md, PDF_GENERATION_GUIDE.md, CONTRACT_IMPLEMENTATION_GUIDE.md

---

## Quick Links

### To Read First

- [General: HTML Sanitization](./HTML_SANITIZATION_SECURITY_GUIDE.md)
- [General: PDF Generation](./PDF_GENERATION_GUIDE.md)
- [Feature: Contract Implementation](./CONTRACT_IMPLEMENTATION_GUIDE.md)

### For Common Tasks

- Prevent XSS → HTML_SANITIZATION_SECURITY_GUIDE.md → Layer 2-4
- Export to PDF → PDF_GENERATION_GUIDE.md → Implementation
- Build contract modal → CONTRACT_IMPLEMENTATION_GUIDE.md → Modal Component Setup
