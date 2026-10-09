// mobile/src/services/advisorService.ts
import { API_BASE_URL } from './api';

/**
 * Custom fetch wrapper for Advisor operations, matching the logic of the main apiFetch
 */
async function advisorApiFetch(path: string, options?: RequestInit) {
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-advisor-role': 'Academic Advisor', // Mocking role context if needed
      ...(options?.headers || {}),
    },
  };

  const res = await fetch(`${API_BASE_URL}${path}`, mergedOptions);
  
  if (res.status === 204) {
    return null; // Handle No Content responses for DELETE
  }

  const data = await res.json().catch(() => null);
  
  if (res.ok) {
    return data;
  }
  
  if (data && data.message) {
    throw new Error(data.message);
  }
  throw new Error(`Request failed with status ${res.status}`);
}

// ============================================================================
// STUDENT REQUEST MANAGEMENT
// ============================================================================

/**
 * Retrieve all requests (for the Dashboard to filter into tabs).
 */
export async function getAllRequests() {
  return advisorApiFetch('/student-requests/all');
}

/**
 * Retrieve all pending requests.
 * Internally fetches all requests and filters for 'PENDING', 
 * or you can rely on a dedicated backend filter if one exists.
 */
export async function getPendingRequests() {
  // Using the /all endpoint we created
  const allRequests = await getAllRequests();
  if (Array.isArray(allRequests)) {
    return allRequests.filter((req: any) => req.status === 'PENDING');
  }
  return [];
}

/**
 * Retrieve a specific request by its ID.
 */
export function getRequestById(requestId: string) {
  return advisorApiFetch(`/student-requests/request/${encodeURIComponent(requestId)}`);
}


// ============================================================================
// ADVISOR REVIEW MANAGEMENT (CRUD)
// ============================================================================

/**
 * Retrieve a review draft by request ID.
 */
export function getReviewByRequestId(requestId: string) {
  return advisorApiFetch(`/advisor-reviews/request/${encodeURIComponent(requestId)}`);
}

/**
 * Create a review draft.
 */
export function createReviewDraft(requestId: string, advisorId: string, comments: string) {
  return advisorApiFetch('/advisor-reviews', {
    method: 'POST',
    body: JSON.stringify({
      requestId,
      advisorId,
      comments,
      decision: 'PENDING',
      reviewStatus: 'DRAFT'
    }),
  });
}

/**
 * Update a review draft.
 */
export function updateReviewDraft(reviewId: string, comments: string, decision: 'APPROVED' | 'REJECTED' | 'PENDING') {
  return advisorApiFetch(`/advisor-reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      comments,
      decision
    }),
  });
}

/**
 * Delete a review draft.
 */
export function deleteReviewDraft(reviewId: string) {
  return advisorApiFetch(`/advisor-reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  });
}

/**
 * Approve a request.
 * Submits the review formally which triggers the backend to update the Request status.
 */
export function approveRequest(requestId: string, advisorId: string, comments: string = 'Request Approved') {
  return advisorApiFetch('/advisor-reviews', {
    method: 'POST',
    body: JSON.stringify({
      requestId,
      advisorId,
      comments,
      decision: 'APPROVED',
      reviewStatus: 'SUBMITTED'
    }),
  });
}

/**
 * Reject a request.
 * Submits the review formally which triggers the backend to update the Request status.
 */
export function rejectRequest(requestId: string, advisorId: string, comments: string = 'Request Rejected') {
  return advisorApiFetch('/advisor-reviews', {
    method: 'POST',
    body: JSON.stringify({
      requestId,
      advisorId,
      comments,
      decision: 'REJECTED',
      reviewStatus: 'SUBMITTED'
    }),
  });
}
