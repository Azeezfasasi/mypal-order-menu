Bug Report: Room Management Inventory PATCH not persisting

Summary

The client PATCH to update room inventory returns success but the subsequent GET may return the old inventory value. This causes the UI to revert the optimistic update.

Steps to reproduce

1. Open Room Management page for a business with rooms.
2. Select date where room inventory is present (e.g., 2026-06-26).
3. Increase inventory for a room (e.g., Lux Room) from 15 to 16 via the UI.

What happened

- PATCH request returned 200 with message "Quantity updated successfully".
- Client logged `roomManagement status fetched` responses showing an intermediate 16 then reverted to 15.

Observed logs (example)

- PATCH payload:
{
  "entity_id": "a81e80b0-c765-4721-8de2-6fc7e7d4b8cc",
  "entity_type": "Accommodation",
  "dates": ["2026-06-26"],
  "quantity_override": 16
}

- PATCH response:
{
  "message": "Quantity updated successfully"
}

- GET /room-management/status responses (timestamps):
  - 2026-07-25T05:36:31.993Z => inventory_amount: 15
  - 2026-07-25T05:36:33.989Z => inventory_amount: 16
  - 2026-07-25T05:36:34.757Z => inventory_amount: 15

Notes

- The API accepted the PATCH but the GET sometimes returns stale/old data.
- Possible causes: eventual consistency, a background job not completed, a cache layer not invalidated, or the PATCH writes to a different dataset.

Requested information for investigation

- Server logs for the PATCH and GET endpoints for the times above.
- Database write confirmation (did the PATCH update the record? which table/row)?
- Any caching layers (Redis, CDN) and their TTLs for the room-management status endpoint.
- Whether PATCH and GET use the same identifiers (entity_id, date) and source of truth.
- Correlation IDs, request IDs, or trace IDs for the requests (if available).

Suggested quick checks

- Verify the PATCH handler writes to the same table the GET reads from.
- Add tracing/logging in the PATCH handler to show DB update result and returned data.
- If using cached aggregates, ensure the cache is invalidated on PATCH or updated atomically.

Client-side mitigation (implemented)

- The client performs optimistic update and polls the status endpoint a few times.
- If persistence isn't observed, the UI shows a toast offering "Retry" which re-sends the PATCH.

Contact

Please include any request/response logs and timestamps when responding. Attach screenshots or network traces when possible.
