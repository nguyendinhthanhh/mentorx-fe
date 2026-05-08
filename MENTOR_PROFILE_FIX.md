# Mentor Profile Navigation Fix ✅

## Issue Description
Users were unable to view mentor profiles when clicking on mentor cards in the Discovery Feed page. The navigation was broken due to an incorrect ID being used in the route.

## Root Cause
The `DiscoveryFeedPage.tsx` component was using `mentor.mentorId` in the Link component to navigate to the mentor profile page:

```tsx
<Link to={`/mentors/${mentor.mentorId}`}>
```

However, the backend API endpoint expects the **user ID**, not a separate mentor ID:

**Backend Endpoint:** `GET /api/mentors/{userId}/profile`

The `MentorRecommendationResponse` type includes both:
- `mentorId`: A separate identifier for the mentor profile entity
- `userId`: The user ID that should be used for API calls

## Solution
Changed the Link component to use `mentor.userId` instead of `mentor.mentorId`:

```tsx
<Link to={`/mentors/${mentor.userId}`}>
```

This matches the backend API structure where mentor profiles are accessed via the user's ID.

## Files Modified
- `mentorx-fe/src/pages/user/DiscoveryFeedPage.tsx` (Line 244)

## Backend API Structure
The backend has the following mentor profile endpoints:

```java
@GetMapping("/{userId}/profile")
public ResponseEntity<ApiResponse<MentorProfileResponse>> getMentorProfile(
    @PathVariable UUID userId
)
```

The frontend routing correctly maps to this:
- **Frontend Route:** `/mentors/:userId` → `MentorPublicProfilePage`
- **Backend API:** `GET /api/mentors/{userId}/profile`

## Testing
✅ **TypeScript Compilation:** No errors
✅ **Route Mapping:** Correct (`/mentors/:userId`)
✅ **API Call:** Uses correct endpoint (`/mentors/${userId}/profile`)

## How to Test
1. Login to the application
2. Navigate to the Discovery Feed page (`/profile/dashboard`)
3. Click "View Profile" on any mentor card
4. Verify the mentor profile page loads correctly with all information

## Related Components
- **Frontend Page:** `mentorx-fe/src/pages/mentor/MentorPublicProfilePage.tsx`
- **API Service:** `mentorx-fe/src/api/mentorApi.ts`
- **Backend Controller:** `mentorx-be/src/main/java/com/mentorx/api/feature/user/controller/MentorProfileController.java`

## Status
✅ **FIXED** - Mentor profile navigation now works correctly!
