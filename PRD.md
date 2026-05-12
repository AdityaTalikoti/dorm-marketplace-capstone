# Dorm Marketplace PRD

## 1. Scope Cut
1. **Payments**: We are not building real money transactions because an MVP can rely on in-person cash or Venmo handoffs to validate core demand first.
2. **Live Chat**: In-app messaging is complex to build reliably; users can use existing platforms (SMS/WhatsApp) using contact info provided upon claim.
3. **Advanced Search and Filtering**: A basic list of items is sufficient for a day 1 prototype to test basic listing and claiming workflows without over-engineering discovery.

## 2. MVP Features
1. **Item Listing**: Users can add an item to the marketplace by providing a title, description, and mock seller name.
2. **Item Feed**: Users can view a feed of all currently available items in the marketplace.
3. **Item Claiming & State Resolution**: Users can claim an item, changing its state to pending, and the seller can mark it as sold or remove it.

## 3. Acceptance Criteria (Claim Item Flow)
1. **Given** an item is listed as "Available", **When** a buyer clicks "Claim", **Then** the item's status changes to "Claimed" and it is no longer available to other buyers.
2. **Given** an item is already "Claimed" by Buyer A, **When** Buyer B attempts to claim it at the exact same moment (Concurrency Collision), **Then** Buyer B's claim fails with an "Item no longer available" message.
3. **Given** a buyer has "Claimed" an item, **When** the 30-second handoff timer expires without confirmation (Ghost Buyer), **Then** the item's status reverts to "Available".
