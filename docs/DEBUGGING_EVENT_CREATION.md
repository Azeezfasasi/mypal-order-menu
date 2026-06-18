# Event Creation Debugging Guide

## Changes Made ✅

1. **Added `event_group` to FormData** - This was missing and is required by the API
2. **Added optional event detail fields** to FormData:
   - event_main_catch
   - event_about_main_catch
   - event_gate_pass
   - event_catchy_phrase
   - event_is_likeable
   - event_is_shareable
   - event_offer_text
   - event_frequency

3. **Added `reservation_config` to FormData** - For table/section booking configuration

4. **Updated dummy data** to include all required fields

## How to Debug the 500 Error

### Step 1: Open Browser Console
Press **F12** and go to the **Console** tab

### Step 2: Fill Form and Submit
1. Click "Fill Demo Data" button to populate the form
2. Go to the last step (Step 2 of 2)
3. Click "Create Event"

### Step 3: Look for Console Output

You should see several sections of logging:

#### Section 1: "[mapFormToApiRequest] FULL FORM DATA RECEIVED"
Look for any **undefined** or missing values

#### Section 2: "[validateApiRequest] Checking API request fields..."
Look for any lines with **❌** that indicate missing fields:
```
❌ businessId: MISSING or EMPTY
❌ dateDetails.startDate: Invalid format '2025-05-10' - should be YYYY-MM-DD
❌ dateDetails.startTime: Invalid format '21:00' - should be HH:mm
```

#### Section 3: "[convertApiRequestToFormData] STARTING"
This shows what's being sent to the API

#### Section 4: "FormData entries: [NUMBER]"
Lists all FormData fields being sent

#### Section 5: "[CRITICAL DEBUG INFO] Bracket notation fields being sent"
Shows location and dateDetails fields

### Step 4: Identify the Problem

**Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| `businessId: MISSING or EMPTY` | Business ID not set | Check auth context |
| `dateDetails.startDate: Invalid format` | Date format wrong | Should be YYYY-MM-DD |
| `dateDetails.startTime: Invalid format` | Time format wrong | Should be HH:mm (24-hour) |
| `location.address: MISSING or EMPTY` | Location not provided | Fill location field |
| `images: 0 images` | No flyer or images | Generate flyer or upload image |
| `event_group: MISSING` | Event group not set | Should be populated by form |

## FormData Format Expected by API

### Required Fields
```
businessId: [string]
businessCategory: [string]
eventCategory: [string] - "Regular Event" or "Exclusive Event"
event_group: [string] - "informative", "Fine Dining", etc.
eventType: [string] - "Plain Informative", "Exclusive 1", "Exclusive 2"
cta: [string] - "None", "Reservation", "Ticketing"
title: [string]
description: [string]
refine_description: [boolean as string]

location[address]: [string] ✓ REQUIRED
location[city]: [string]
location[state]: [string]
location[country]: [string]

dateDetails[startDate]: [YYYY-MM-DD] ✓ REQUIRED
dateDetails[endDate]: [YYYY-MM-DD] ✓ REQUIRED
dateDetails[startTime]: [HH:mm] ✓ REQUIRED
dateDetails[endTime]: [HH:mm] ✓ REQUIRED
dateDetails[duration]: [string] (optional)

images[0]: [image-url] ✓ REQUIRED (at least one)
```

### Optional Fields
```
event_main_catch: [string]
event_about_main_catch: [string]
event_gate_pass: [string]
event_catchy_phrase: [string]
event_is_likeable: [boolean as string]
event_is_shareable: [boolean as string]
event_offer_text: [string]
event_frequency: [string]

reservation_config[min_guests]: [number as string]
reservation_config[max_guests]: [number as string]
reservation_config[is_table_booking]: [boolean as string]
reservation_config[reservation_fee]: [number as string]

ticketTypes[0][id]: [string]
ticketTypes[0][ticket_name]: [string]
ticketTypes[0][price]: [number as string]

benefits[0][id]: [string]
benefits[0][title]: [string]
benefits[0][description]: [string]

agenda[0][id]: [string]
agenda[0][time]: [string]
agenda[0][activity]: [string]
```

## Next Steps

1. **Try submitting again** with the fixed code
2. **Open console** and look for validation errors
3. **Take a screenshot** of the console showing:
   - The validation section with ❌ marks
   - The FormData entries section
   - The API response error
4. **Share that screenshot** - this will pinpoint the exact issue

## Files Modified

- `src/components/events/create-event-modal/utils/apiDataMapper.ts` - Added all missing fields
- `src/components/events/create-event-modal/types.ts` - Updated type definitions
- `src/data/event-dummy-data.ts` - Updated dummy data with all required fields

## API Endpoint Format

The endpoint `/v1/events/create` expects:
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Format:** All nested objects use bracket notation (e.g., `location[address]`)
- **Time Format:** 24-hour format (HH:mm)
- **Date Format:** ISO 8601 (YYYY-MM-DD)
