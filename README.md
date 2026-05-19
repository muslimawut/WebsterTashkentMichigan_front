# Webster University - Michigan Test Center Landing Page

Modern va professional landing page for Webster University's Michigan Test Center.

## 📁 Project Structure

```
webster-project/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Navigation bar with logo and auth buttons
│   │   ├── HeroSection.jsx      # Main hero section with CTA
│   │   ├── VideoSection.jsx     # Application guide video section
│   │   ├── TestDatesSection.jsx # Upcoming test dates cards
│   │   ├── CTASection.jsx       # Call-to-action section
│   │   ├── Footer.jsx           # Footer with links and contact info
│   │   ├── SignInModal.jsx      # Sign in information modal
│   │   └── PaymentModal.jsx     # Test registration and payment modal
│   ├── App.jsx                  # Main application component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles with Tailwind
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 🎨 Features

- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Modern UI/UX**: Clean and professional interface with Tailwind CSS
- **Component-Based**: Modular architecture for better maintainability
- **Performance Optimized**: Separated components for better code splitting
- **Interactive Modals**: 
  - Sign In modal with application process information
  - Payment modal with multiple payment methods (Payme, Click, Uzum)
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: Proper semantic HTML and ARIA labels

## 🔧 Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📦 Components Overview

### Navbar
- Sticky navigation with logo
- Sign In, Sign Up buttons
- Test Dates link
- Responsive mobile menu

### HeroSection
- Main heading and description
- Call-to-action buttons

### VideoSection
- Embedded YouTube video guide
- 3-step application process cards

### TestDatesSection
- Grid of available test dates
- Registration buttons for each date
- Opens payment modal on click

### PaymentModal
- Shows selected test date and time
- Displays test location
- Test fee amount (450,000 UZS)
- Payment method selection (Payme, Click, Uzum)
- Disabled/enabled Pay button based on selection

### SignInModal
- Application process information
- Instructions for applying
- Link to Webster University website
- Warning about application approval

## 🎯 Performance Benefits

Separating into components provides:
- **Better Code Organization**: Easy to find and maintain code
- **Reusability**: Components can be reused across the app
- **Lazy Loading**: Can implement code splitting for larger apps
- **Easier Testing**: Each component can be tested independently
- **Team Collaboration**: Multiple developers can work on different components
- **Bundle Optimization**: Vite automatically optimizes imports

## 📝 License

This project is private and proprietary to Webster University.