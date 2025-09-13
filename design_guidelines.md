# Design Guidelines: Sphero Edu Jr.-Style Robot Programming App

## Design Approach
**Reference-Based Approach**: Taking inspiration from educational robotics platforms like Sphero Edu Jr., Scratch Jr., and MIT App Inventor. This is an experience-focused, visual-rich application where engagement and ease-of-use drive adoption among young learners.

**Key Design Principles:**
- Playful and approachable for young users
- Clear visual feedback for robot connection status
- Intuitive drag-and-drop programming interface
- Mobile-first responsive design

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Brand Blue: 210 85% 45% (trustworthy, tech-forward)
- Success Green: 145 70% 50% (connected status)
- Warning Orange: 35 90% 55% (connection issues)

**Supporting Colors:**
- Background Light: 220 15% 97%
- Background Dark: 220 25% 15%
- Text Primary: 220 20% 20% (light mode) / 220 15% 85% (dark mode)
- Block Colors: Vibrant hues (280 70% 60%, 350 75% 55%, 60 80% 50%) for different programming categories

### B. Typography
**Primary Font:** Inter (Google Fonts)
- Headers: 600 weight
- Body: 400 weight
- Code blocks: 500 weight

**Font Scale:**
- Hero: text-4xl (36px)
- Section headers: text-2xl (24px)
- Body: text-base (16px)
- Small text: text-sm (14px)

### C. Layout System
**Spacing Units:** Consistent use of Tailwind units 2, 4, 6, 8, 12
- Component padding: p-4, p-6
- Section spacing: mb-8, mb-12
- Element margins: m-2, m-4

### D. Component Library

**Navigation:**
- Clean top navigation with robot connection status indicator
- Hamburger menu for mobile with slide-out drawer

**Robot Connection Interface:**
- Large, prominent "Connect Robot" button with Bluetooth icon
- Connection status cards with clear visual indicators
- Device discovery list with signal strength indicators

**Block Programming Interface:**
- Categorized block palette with color-coded sections
- Drag-and-drop workspace with snap guides
- Floating action buttons for play/stop/clear

**Forms and Controls:**
- Rounded input fields with soft shadows
- Toggle switches for settings
- Slider controls for speed/timing parameters

**Data Displays:**
- Real-time connection status badges
- Program execution progress indicators
- Robot sensor value displays

**Overlays:**
- Connection setup modal with step-by-step guidance
- Block parameter configuration popovers
- Help tooltips with friendly explanations

### E. Visual Treatments

**Gradients:**
- Subtle background gradients from primary blue to lighter tint
- Block category headers with gentle color transitions
- Connection status indicators with animated gradients

**Shadows and Depth:**
- Soft drop shadows on programming blocks (shadow-lg)
- Elevated cards for robot connection interface
- Floating effect on draggable elements

**Interactive Elements:**
- Gentle hover states with subtle scale transforms
- Clear pressed states for tactile feedback
- Smooth transitions (transition-all duration-200)

## Mobile-First Considerations

**Touch Targets:**
- Minimum 44px tap targets for programming blocks
- Generous spacing between interactive elements
- Large, easy-to-tap connection buttons

**Layout Adaptations:**
- Collapsible block palette for small screens
- Swipe gestures for block category navigation
- Bottom sheet for robot controls on mobile

**Performance:**
- Optimized block rendering for smooth drag operations
- Efficient Bluetooth connection management
- Progressive enhancement for desktop features

## Images
No large hero images required. Focus on:
- Robot connection illustrations (simple line art)
- Programming block icons (geometric shapes)
- Status indicator graphics (Bluetooth symbols, battery icons)
- Onboarding tutorial visuals (step-by-step screenshots)

This design creates an engaging, educational experience that makes robot programming accessible and fun for young learners while maintaining professional functionality.