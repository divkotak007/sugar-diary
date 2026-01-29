# Prescription Page - Complete Theme Reference

## 🎨 Color Palette

```javascript
// Primary Colors
const THEME = {
  insulin: {
    primary: 'emerald-500',
    hover: 'emerald-600',
    light: 'emerald-50',
    border: 'border-l-emerald-500'
  },
  oralMeds: {
    primary: 'blue-500',
    hover: 'blue-600', 
    light: 'blue-50',
    border: 'border-l-blue-500'
  },
  tags: {
    benefit: { bg: 'emerald-50', text: 'emerald-600' },
    warning: { bg: 'amber-50', text: 'amber-600' },
    neutral: { bg: 'stone-50', text: 'stone-500' }
  },
  text: {
    primary: 'stone-800',
    secondary: 'stone-400',
    muted: 'stone-500'
  },
  background: {
    main: 'stone-100/60',
    card: 'white',
    hover: 'stone-50'
  },
  border: {
    default: 'stone-200',
    light: 'stone-100'
  }
};
```

## 📦 Main Container

```jsx
<div className="bg-stone-100/60 dark:bg-stone-900 p-6 rounded-[24px] shadow-sm mb-6 border border-stone-200/50">
  <h3 className="font-medium text-stone-400 dark:text-stone-500 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
    Prescription
  </h3>
</div>
```

## 🔍 Search Inputs

### Insulin Search
```jsx
// Container (inactive state)
className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-text
  bg-transparent border-stone-200 hover:border-stone-300 hover:bg-white/50"

// Container (active/focused state)
className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-text
  bg-white border-emerald-500 ring-2 ring-emerald-50 shadow-lg"

// Icon
<Syringe size={18} className="text-emerald-500" /> // when active
<Syringe size={18} className="text-stone-400" />   // when inactive

// Input field
<input className="flex-1 bg-transparent outline-none font-medium text-stone-800 placeholder-stone-400 text-sm" />
```

### Oral Medicine Search
```jsx
// Container (active state)
className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-text
  bg-white border-blue-500 ring-2 ring-blue-50 shadow-lg"

// Icon
<Pill size={18} className="text-blue-500" /> // when active
<Pill size={18} className="text-stone-400" /> // when inactive
```

## 📋 Dropdown Results

```jsx
// Dropdown container
className="absolute top-full left-0 right-0 mt-2 
  bg-white rounded-xl shadow-xl border border-stone-100 
  max-h-60 overflow-y-auto z-50 
  animate-in fade-in slide-in-from-top-2"

// Result item button
className="w-full text-left p-3 hover:bg-stone-50 flex items-center justify-between group"

// Medicine name (bold)
<span className="font-bold text-stone-700 text-sm">Metformin 500mg</span>

// Brand/generic info (subtle)
<span className="text-[10px] text-stone-400 mt-0.5">
  Generic: Metformin | Other: Glycomet, Obimet
</span>

// Add icon
<PlusCircle size={16} className="text-stone-300 group-hover:text-emerald-500" />
```

## 💊 Prescription Cards

### Insulin Card
```jsx
<div className="bg-white p-4 rounded-xl shadow-sm 
  border border-stone-100 border-l-4 border-l-emerald-500 
  relative group">
  
  {/* Header */}
  <div className="flex justify-between items-start mb-2">
    <div className="flex flex-col">
      {/* Medicine name */}
      <span className="font-bold text-stone-800 text-base">Lantus</span>
      <span className="text-xs text-stone-400">(Generic: Insulin Glargine)</span>
      
      {/* Class badge */}
      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 
        text-[9px] font-bold uppercase tracking-wider">Insulin</span>
    </div>
    
    {/* Delete button */}
    <button className="text-stone-300 hover:text-red-400 p-1 
      opacity-0 group-hover:opacity-100 transition-opacity">
      <X size={16} />
    </button>
  </div>
  
  {/* Clinical tags */}
  <div className="flex flex-wrap gap-1 mb-2">
    <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold 
      uppercase tracking-wider bg-emerald-50 text-emerald-600">
      CKD SAFE
    </span>
  </div>
  
  {/* Dose input */}
  <input className="w-full bg-stone-50 border-transparent 
    focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 
    rounded-xl p-2.5 text-sm font-bold placeholder-stone-400 
    transition-all outline-none" 
    placeholder="Dose (Units)" />
</div>
```

### Oral Medicine Card
```jsx
<div className="bg-white p-4 rounded-xl shadow-sm 
  border border-stone-100 border-l-4 border-l-blue-500 
  relative group">
  
  {/* Medicine name */}
  <span className="font-bold text-stone-800 text-base">Glycomet 500</span>
  <span className="text-xs text-stone-400 ml-2">(Generic: Metformin)</span>
  
  {/* Frequency pills */}
  <div className="flex flex-wrap gap-2 mb-2">
    {/* Selected state */}
    <button className="px-2.5 py-1 rounded-full text-[10px] font-bold border
      bg-stone-800 text-white border-stone-800 shadow-sm">
      ☀️ Morning
    </button>
    
    {/* Unselected state */}
    <button className="px-2.5 py-1 rounded-full text-[10px] font-bold border
      bg-white text-stone-400 border-stone-200 hover:border-stone-300">
      🌤️ Afternoon
    </button>
    
    <button className="px-2.5 py-1 rounded-full text-[10px] font-bold border
      bg-white text-stone-400 border-stone-200 hover:border-stone-300">
      🌆 Evening
    </button>
    
    <button className="px-2.5 py-1 rounded-full text-[10px] font-bold border
      bg-stone-800 text-white border-stone-800 shadow-sm">
      🌙 Night
    </button>
  </div>
  
  {/* Food timing guidance */}
  <div className="text-[10px] text-stone-400 font-medium pl-1">
    Take after food
  </div>
</div>
```

## 🏷️ Clinical Tags

```jsx
// Benefit tags (green)
<span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold 
  uppercase tracking-wider bg-emerald-50 text-emerald-600">
  CKD BENEFIT
</span>

// Warning tags (amber)
<span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold 
  uppercase tracking-wider bg-amber-50 text-amber-600">
  HIGH HYPO RISK
</span>

// Neutral tags (gray)
<span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold 
  uppercase tracking-wider bg-stone-50 text-stone-500">
  WEIGHT NEUTRAL
</span>
```

## ⏱️ Frequency Icons

```javascript
const FREQUENCY_ICONS = {
  'Morning': '☀️',
  'Afternoon': '🌤️',
  'Evening': '🌆',
  'Night': '🌙'
};
```

## 📐 Spacing System

```javascript
const SPACING = {
  cardPadding: 'p-4',           // 16px (previously p-5 = 20px)
  cardGap: 'space-y-3',         // 12px between cards
  elementGap: 'gap-2',          // 8px between elements
  inputPadding: 'p-2.5',        // 10px (previously p-3 = 12px)
  marginBottom: 'mb-2',         // 8px (previously mb-3 = 12px)
  borderRadius: 'rounded-xl',   // 12px (previously rounded-2xl = 16px)
};
```

## 🔤 Typography Scale

```javascript
const TYPOGRAPHY = {
  medicineName: 'font-bold text-stone-800 text-base',      // 16px bold
  genericRef: 'text-xs text-stone-400',                     // 12px muted
  classBadge: 'text-[9px] font-bold uppercase',            // 9px
  clinicalTag: 'text-[8px] font-bold uppercase',           // 8px
  frequencyPill: 'text-[10px] font-bold',                  // 10px
  inputText: 'text-sm font-bold',                          // 14px
  placeholder: 'placeholder-stone-400',                    // gray placeholder
  sectionHeader: 'text-sm uppercase tracking-widest',      // 14px spaced
};
```

## 🎭 Interactive States

```jsx
// Hover states
hover:bg-stone-50          // Subtle background on hover
hover:border-stone-300     // Border darkens on hover
hover:text-red-400         // Delete button turns red
group-hover:opacity-100    // Reveal on card hover
group-hover:text-emerald-500  // Icon color change

// Focus states
focus:bg-white             // Background lightens
focus:border-emerald-200   // Border color change
focus:ring-4 focus:ring-emerald-50  // Ring appears

// Active/Selected states
bg-stone-800 text-white    // Dark filled state (frequency selected)
border-emerald-500 ring-2 ring-emerald-50  // Active search input
```

## 🌓 Dark Mode Support

```jsx
// Main container
dark:bg-stone-900

// Section header
dark:text-stone-500

// Note: Cards remain white in dark mode for medical clarity
```

## 📱 Responsive Patterns

```jsx
// All cards are fluid width
className="w-full"

// Flex wrapping for pills
className="flex flex-wrap gap-2"

// Scrollable dropdowns
className="max-h-60 overflow-y-auto"
```

## ✨ Animation Classes

```jsx
// Dropdown entrance
animate-in fade-in slide-in-from-top-2

// Button transitions
transition-all
transition-colors
transition-opacity
```

---

**Summary**: The prescription theme uses a clean, medical-grade aesthetic with emerald accents for insulin and blue for oral medications. All cards are compact (25% size reduction), elderly-friendly (high contrast, readable fonts), and maintain consistent spacing throughout.
