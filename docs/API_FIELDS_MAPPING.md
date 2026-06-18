# Event Creation API - Fields Mapping

## Required Fields (from Swagger API Documentation)

### Core Required Fields
- ✅ **businessId** - Business ID (inferred from auth)
- ✅ **businessCategory** - Business category (e.g., "Fine Dining", "Nightlife")
- ✅ **eventCategory** - "Regular Event" or "Exclusive Event"
- ✅ **event_group** - Visual layout grouping ("Informative", "Fine Dining", "Buffet", "Ticketing", "Clubbing")
- ✅ **eventType** - "Plain Informative", "Exclusive 1", or "Exclusive 2"
- ✅ **cta** - Event CTA - "None", "Reservation", or "Ticketing"
- ✅ **title** - Event title (from event_title)
- ✅ **description** - Event description (from about field)
- ✅ **images** - Array of image URLs (required - needs at least one image)
- ✅ **dateDetails** - Date/time object with startDate, endDate, startTime, endTime
- ✅ **location** - Location object with address, city, state, country

### Optional Fields (Now Being Sent)
- ✅ **image** - Optional image file upload (multipart)
- ✅ **event_main_catch** - Main catch text (from main_catch)
- ✅ **event_about_main_catch** - About main catch (from about_main_catch)
- ✅ **event_gate_pass** - Gate pass/entry details (from event_gate_pass)
- ✅ **event_catchy_phrase** - Catchy phrase (from catchy_phrase)
- ✅ **event_is_likeable** - Visual likeable hint (boolean)
- ✅ **event_is_shareable** - Visual shareable hint (boolean)
- ✅ **event_offer_text** - Offer text (from event_offer_text)
- ✅ **event_frequency** - Event frequency (from event_frequency)
- ✅ **refine_description** - Should AI refine description (boolean)
- ✅ **reservation_config** - Reservation configuration object
- ✅ **ticketTypes** - Array of ticket objects
- ✅ **benefits** - Array of benefit objects (from benefits array)
- ✅ **agenda** - Array of agenda items (from agendas array)
- ✅ **reservationDetails** - Reservation pricing details
- ✅ **reservationTypes** - Array of reservation types

## Current Form Fields Status

### Being Sent to API ✅
- businessId ✅
- businessCategory ✅
- eventCategory ✅
- event_group ✅ (NOW ADDED)
- eventType ✅
- cta ✅
- title ✅
- description ✅
- location ✅
- dateDetails ✅
- images ✅
- image ✅
- event_main_catch ✅ (NOW ADDED)
- event_about_main_catch ✅ (NOW ADDED)
- event_gate_pass ✅ (NOW ADDED)
- event_catchy_phrase ✅ (NOW ADDED)
- event_is_likeable ✅ (NOW ADDED)
- event_is_shareable ✅ (NOW ADDED)
- event_offer_text ✅ (NOW ADDED)
- event_frequency ✅ (NOW ADDED)
- refine_description ✅
- reservation_config ✅ (NOW ADDED)
- ticketTypes ✅
- benefits ✅
- agenda ✅
- reservationDetails ✅
- reservationTypes ✅ (NOW ADDED)

## Debugging Notes

1. All field mappings have been updated in `apiDataMapper.ts`
2. All fields are now logged to console when form is submitted
3. Check browser console for "API Request - ALL FIELDS MAPPING" to see exactly what's being sent
4. Ensure `images` array is never empty - it must have at least one image URL or generated flyer URL

## Images Field Critical Issue

⚠️ **IMPORTANT**: The `images` array MUST NOT be empty. Make sure:
- Either `flyer_url` is set (AI-generated flyer), OR
- At least one image URL is provided in the `images` array

Default fallback: `images: formData.flyer_url ? [formData.flyer_url] : formData.images || []`

If this becomes empty, the API will reject with "all fields are required" error.

## Next Steps

1. Run the form submission again
2. Check browser console for the logged "API Request - ALL FIELDS MAPPING"
3. Identify which field is missing or has an incorrect value
4. Report the issue with the exact field name and expected vs actual value
