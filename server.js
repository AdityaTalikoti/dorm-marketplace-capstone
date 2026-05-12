const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let items = [
  {
    id: "1",
    title: "Calculus Textbook",
    description: "Slightly used, minimal highlights",
    sellerName: "Alice",
    status: "Available",
    claimedBy: null,
    timerStart: null
  },
  {
    id: "2",
    title: "Mini Fridge",
    description: "Works perfectly, need to get rid of it before moving out.",
    sellerName: "Bob",
    status: "Available",
    claimedBy: null,
    timerStart: null
  }
];

const timers = {};
const EXPIRATION_MS = 15000; // 15 seconds for Ghost Buyer scenario

// Get all items
app.get('/api/items', (req, res) => {
  res.json(items.map(item => {
    // Send remaining time if claimed
    let remainingTime = 0;
    if (item.status === 'Claimed' && item.timerStart) {
      const elapsed = Date.now() - item.timerStart;
      remainingTime = Math.max(0, EXPIRATION_MS - elapsed);
    }
    return { ...item, remainingTime };
  }));
});

// Create item
app.post('/api/items', (req, res) => {
  const { title, description, sellerName } = req.body;
  const newItem = {
    id: Date.now().toString(),
    title,
    description,
    sellerName,
    status: "Available",
    claimedBy: null,
    timerStart: null
  };
  items.push(newItem);
  res.status(201).json(newItem);
});

// Claim item
app.post('/api/items/:id/claim', (req, res) => {
  const { id } = req.params;
  const { buyerName } = req.body;
  const item = items.find(i => i.id === id);

  if (!item) return res.status(404).json({ error: "Item not found" });

  // Scenario 1: The Concurrency Collision
  if (item.status !== "Available") {
    return res.status(409).json({ error: "Item no longer available" });
  }

  item.status = "Claimed";
  item.claimedBy = buyerName;
  item.timerStart = Date.now();

  // Scenario 2: The Ghost Buyer
  timers[id] = setTimeout(() => {
    const currentItem = items.find(i => i.id === id);
    if (currentItem && currentItem.status === "Claimed") {
      currentItem.status = "Available";
      currentItem.claimedBy = null;
      currentItem.timerStart = null;
      console.log(`Item ${id} claim expired (Ghost Buyer). Reverted to Available.`);
    }
  }, EXPIRATION_MS);

  res.json(item);
});

// Confirm handoff
app.post('/api/items/:id/confirm', (req, res) => {
  const { id } = req.params;
  const item = items.find(i => i.id === id);

  if (!item) return res.status(404).json({ error: "Item not found" });
  if (item.status !== "Claimed") return res.status(400).json({ error: "Item is not currently claimed" });

  if (timers[id]) {
    clearTimeout(timers[id]);
    delete timers[id];
  }

  item.status = "Sold";
  item.timerStart = null;
  res.json(item);
});

// Scenario 3: The Hallway Sale - Force Remove / Mark as Sold
app.post('/api/items/:id/remove', (req, res) => {
  const { id } = req.params;
  const itemIndex = items.findIndex(i => i.id === id);

  if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });

  if (timers[id]) {
    clearTimeout(timers[id]);
    delete timers[id];
  }

  // Remove the item entirely or mark it as sold. Let's mark as sold to keep history for the prototype.
  items[itemIndex].status = "Sold";
  items[itemIndex].timerStart = null;
  
  res.json({ success: true, message: "Item removed / marked as sold via override" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
