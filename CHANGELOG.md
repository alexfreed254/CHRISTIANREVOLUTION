# Changelog - Christ Revolution Movement

## [Update] - Renamed "Giving" to "Support and Donations"

### Changes Made

All references to "Giving" or "Give" have been updated to "Support and Donations" or "Support" throughout the application for consistency and clarity.

### Files Modified

#### 1. **frontend/src/pages/Give.jsx**
- Page title: "Give" → "Support and Donations"
- Section heading: "Make a Gift" → "Make a Donation"
- Section heading: "Why Give?" → "Why Support?"
- Error message: "Please login to give" → "Please login to donate"
- Success message: "Thank you for your generous gift!" → "Thank you for your generous donation!"
- Checkbox label: "Make this a recurring monthly gift" → "Make this a recurring monthly donation"
- Tax section: "Your generous gifts are tax-deductible" → "Your generous donations are tax-deductible"
- Button text: "Complete Gift" → "Complete Donation"

#### 2. **frontend/src/pages/Portal.jsx**
- Stats label: "Giving" → "Donations"
- Card heading: "Giving History" → "Support History"
- Card description: "View your contributions" → "View your donations"
- Activity text: "Gave $50 offering" → "Donated $50 offering"

#### 3. **frontend/src/pages/Home.jsx**
- Footer link: "Give" → "Support"

#### 4. **frontend/src/components/common/Navbar.jsx**
- Navigation link label: "Give" → "Support"

### Impact

These changes affect:
- ✅ Navigation menu (desktop and mobile)
- ✅ Page headers and titles
- ✅ Form labels and buttons
- ✅ Success/error messages
- ✅ Dashboard statistics
- ✅ Footer links
- ✅ User-facing text throughout the application

### Route Paths

**Note:** The URL route remains `/give` for consistency with backend API endpoints. Only the display text has been changed to "Support" or "Support and Donations".

### Backend Compatibility

No backend changes required. The API endpoint `/api/give` remains unchanged, ensuring full compatibility with existing backend implementation.

---

**Date:** January 2024
**Updated by:** Kiro AI
**Status:** Complete ✅
