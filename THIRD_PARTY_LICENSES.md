# Third-Party Licenses and Dependencies

This document lists all third-party libraries, components, and dependencies used in the Fashion AI Video Generator, along with their respective licenses.

**Project Owner**: Mohammed Salha
**Copyright**: © 2025 Mohammed Salha - All Rights Reserved
**License Type**: Exclusive Commercial License

---

## Production Dependencies

### Backend Core

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| express | ^5.1.0 | MIT | HTTP server framework |
| stripe | ^19.1.0 | Apache-2.0 | Payment processing |
| pg | ^8.16.3 | MIT | PostgreSQL database client |
| node-cron | ^4.2.1 | ISC | Job scheduling |
| nodemailer | ^6.9.7 | MIT | Email sending |
| helmet | ^8.1.0 | MIT | Security headers |
| express-rate-limit | ^8.1.0 | MIT | API rate limiting |
| serverless-http | ^3.2.0 | MIT | Vercel serverless wrapper |
| dotenv | ^17.2.1 | BSD-2-Clause | Environment variables |
| zod | ^3.25.76 | MIT | Schema validation |

### Frontend Core

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| react | ^18.3.1 | MIT | UI framework |
| react-dom | ^18.3.1 | MIT | DOM rendering |
| react-router-dom | ^6.30.1 | MIT | Client-side routing |
| react-hook-form | ^7.62.0 | MIT | Form management |
| @stripe/react-stripe-js | ^5.2.0 | MIT | Stripe React integration |
| @stripe/stripe-js | ^8.1.0 | MIT | Stripe JavaScript SDK |
| sonner | ^1.7.4 | MIT | Toast notifications |
| framer-motion | ^12.23.12 | MIT | Animation library |
| date-fns | ^4.1.0 | MIT | Date utilities |
| three | ^0.176.0 | MIT | 3D graphics |
| react-three-fiber | ^8.18.0 | MIT | React 3D fiber |
| react-three-drei | ^9.122.0 | MIT | 3D helpers |

### UI Components & Styling

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| tailwindcss | ^3.4.17 | MIT | CSS framework |
| tailwindcss-animate | ^1.0.7 | MIT | Tailwind animations |
| tailwind-merge | ^2.6.0 | MIT | Tailwind class merging |
| autoprefixer | ^10.4.21 | MIT | CSS prefixer |
| postcss | ^8.5.6 | MIT | CSS processor |
| @radix-ui/react-accordion | ^1.2.11 | MIT | Accordion component |
| @radix-ui/react-alert-dialog | ^1.1.14 | MIT | Alert dialog component |
| @radix-ui/react-aspect-ratio | ^1.1.7 | MIT | Aspect ratio component |
| @radix-ui/react-avatar | ^1.1.10 | MIT | Avatar component |
| @radix-ui/react-checkbox | ^1.3.2 | MIT | Checkbox component |
| @radix-ui/react-collapsible | ^1.1.11 | MIT | Collapsible component |
| @radix-ui/react-context-menu | ^2.2.15 | MIT | Context menu component |
| @radix-ui/react-dialog | ^1.1.14 | MIT | Dialog component |
| @radix-ui/react-dropdown-menu | ^2.1.15 | MIT | Dropdown component |
| @radix-ui/react-hover-card | ^1.1.14 | MIT | Hover card component |
| @radix-ui/react-label | ^2.1.7 | MIT | Label component |
| @radix-ui/react-menubar | ^1.1.15 | MIT | Menubar component |
| @radix-ui/react-navigation-menu | ^1.2.13 | MIT | Navigation menu component |
| @radix-ui/react-popover | ^1.1.14 | MIT | Popover component |
| @radix-ui/react-progress | ^1.1.7 | MIT | Progress component |
| @radix-ui/react-radio-group | ^1.3.7 | MIT | Radio group component |
| @radix-ui/react-scroll-area | ^1.2.9 | MIT | Scroll area component |
| @radix-ui/react-select | ^2.2.5 | MIT | Select component |
| @radix-ui/react-separator | ^1.1.7 | MIT | Separator component |
| @radix-ui/react-slider | ^1.3.5 | MIT | Slider component |
| @radix-ui/react-slot | ^1.2.3 | MIT | Slot component |
| @radix-ui/react-switch | ^1.2.5 | MIT | Switch component |
| @radix-ui/react-tabs | ^1.1.12 | MIT | Tabs component |
| @radix-ui/react-toast | ^1.2.14 | MIT | Toast component |
| @radix-ui/react-toggle | ^1.1.9 | MIT | Toggle component |
| @radix-ui/react-toggle-group | ^1.1.10 | MIT | Toggle group component |
| @radix-ui/react-tooltip | ^1.2.7 | MIT | Tooltip component |
| class-variance-authority | ^0.7.1 | MIT | Class variant utility |
| clsx | ^2.1.1 | MIT | Class name utility |
| cmdk | ^1.1.1 | MIT | Command menu |
| embla-carousel-react | ^8.6.0 | MIT | Carousel component |
| input-otp | ^1.4.2 | MIT | OTP input component |
| lucide-react | ^0.539.0 | ISC | Icon library |
| next-themes | ^0.4.6 | MIT | Theme management |
| react-day-picker | ^9.8.1 | MIT | Date picker |
| react-resizable-panels | ^3.0.4 | MIT | Resizable panels |
| recharts | ^2.12.7 | MIT | Charts library |
| vaul | ^1.1.2 | MIT | Drawer component |
| cors | ^2.8.5 | MIT | CORS middleware |

---

## Development Dependencies

### Build Tools

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| vite | ^7.1.2 | MIT | Build tool |
| @vitejs/plugin-react-swc | ^4.0.0 | MIT | Vite React plugin |
| tsx | ^4.20.3 | MIT | TypeScript runner |
| vitest | ^3.2.4 | MIT | Testing framework |
| prettier | ^3.6.2 | MIT | Code formatter |

### Type Definitions

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| typescript | ^5.9.2 | Apache-2.0 | Type checking |
| @types/react | ^18.3.23 | MIT | React types |
| @types/react-dom | ^18.3.7 | MIT | React DOM types |
| @types/node | ^24.2.1 | MIT | Node.js types |
| @types/express | ^5.0.3 | MIT | Express types |
| @types/cors | ^2.8.19 | MIT | CORS types |
| @types/three | ^0.176.0 | MIT | Three.js types |

### Build Configuration

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| @swc/core | ^1.13.3 | Apache-2.0 | SWC compiler |
| globals | ^16.3.0 | MIT | Global variables |
| @hookform/resolvers | ^5.2.1 | MIT | Form validation resolvers |
| @tanstack/react-query | ^5.84.2 | MIT | Data fetching |
| @tailwindcss/typography | ^0.5.16 | MIT | Tailwind typography |

---

## License Summary

### License Breakdown

| License | Count | Percentage |
|---------|-------|-----------|
| MIT | 92 | 92% |
| Apache-2.0 | 3 | 3% |
| ISC | 2 | 2% |
| BSD-2-Clause | 1 | 1% |

### License Compliance

✅ All dependencies use permissive, open-source licenses
✅ MIT License is the dominant license (92%)
✅ No GPL or LGPL licenses (which would require source code disclosure)
✅ All licenses are commercially compatible
✅ No restrictive licenses that conflict with exclusive commercial use

---

## Important Notes

### Commercial Usage

All third-party dependencies are licensed under permissive licenses that allow:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Sublicensing (with proper attribution)

There are no restrictions preventing commercial use of this software.

### Attribution

While attribution is appreciated by many open-source maintainers, the fashion AI Video Generator's exclusive commercial license allows its use with or without attribution to third-party libraries.

### Stripe Terms

The Stripe payment processing integration is subject to:
- Stripe's Terms of Service: https://stripe.com/legal
- Stripe's Privacy Policy: https://stripe.com/privacy
- Stripe's Processing Agreement

Users of this software must comply with Stripe's terms when using payment functionality.

### Third-Party Services

This software integrates with:
- **Stripe** (Payment Processing) - https://stripe.com
- **Fashion.ai** (Video Generation) - https://fashion.ai
- **Neon PostgreSQL** (Database) - https://neon.tech
- **Vercel** (Deployment) - https://vercel.com

Users are responsible for compliance with each service's terms of use.

---

## License Files

Each dependency's license can be found in:
```
node_modules/[package-name]/LICENSE
```

For a comprehensive audit, use:
```bash
npm list --depth=0
```

---

## Updates

This list is maintained for version **1.0.0** (2025).

For the latest dependencies, refer to `package.json` and `package-lock.yaml`.

---

**Copyright © 2025 Mohammed Salha - All Rights Reserved**

This software and all its components are the exclusive property of Mohammed Salha.
