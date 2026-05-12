const listForm = document.getElementById('list-form');
const itemsContainer = document.getElementById('items-container');
const currentUserInput = document.getElementById('current-user');

let items = [];
let localTimers = {};

async function fetchItems() {
  const res = await fetch('/api/items');
  items = await res.json();
  renderItems();
}

function renderItems() {
  itemsContainer.innerHTML = '';
  const currentUser = currentUserInput.value.trim();

  if (items.length === 0) {
    itemsContainer.innerHTML = '<p style="color: var(--text-secondary)">No items available right now. Be the first to list one!</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const isSeller = item.sellerName === currentUser;
    const isClaimer = item.claimedBy === currentUser;

    let actionsHtml = '';

    if (item.status === 'Available') {
      if (!isSeller) {
        actionsHtml += `<button class="btn-claim" onclick="claimItem('${item.id}')">Claim Item</button>`;
      }
      if (isSeller) {
        actionsHtml += `<button class="btn-remove" onclick="removeItem('${item.id}')">Remove / Mark Sold</button>`;
      }
    } else if (item.status === 'Claimed') {
      if (isClaimer) {
        actionsHtml += `<button class="btn-confirm" onclick="confirmHandoff('${item.id}')">Confirm Handoff</button>`;
      } else {
        actionsHtml += `<span style="color: var(--text-secondary); font-size: 0.85rem">Claimed by ${item.claimedBy}</span>`;
      }
      
      if (isSeller) {
         actionsHtml += `<button class="btn-remove" onclick="removeItem('${item.id}')">Force Remove</button>`;
      }

      // Timer display
      if (item.remainingTime > 0) {
        actionsHtml += `<div class="timer" id="timer-${item.id}">Expiring in: ${Math.ceil(item.remainingTime / 1000)}s</div>`;
        startLocalTimer(item.id, item.remainingTime);
      }
    } else if (item.status === 'Sold') {
        actionsHtml += `<span style="color: var(--text-secondary); font-size: 0.85rem">No actions available</span>`;
    }

    card.innerHTML = `
      <div class="item-header">
        <div class="item-title">${item.title}</div>
        <div class="item-status status-${item.status.toLowerCase()}">${item.status}</div>
      </div>
      <div class="item-desc">${item.description}</div>
      <div class="item-meta">
        <span>Seller: ${item.sellerName}</span>
      </div>
      <div class="item-actions">
        ${actionsHtml}
      </div>
    `;

    itemsContainer.appendChild(card);
  });
}

function startLocalTimer(id, remainingTime) {
  if (localTimers[id]) clearInterval(localTimers[id]);
  
  let time = Math.ceil(remainingTime / 1000);
  const timerEl = document.getElementById(`timer-${id}`);
  
  localTimers[id] = setInterval(() => {
    time--;
    if (timerEl) {
      timerEl.textContent = `Expiring in: ${time}s`;
    }
    if (time <= 0) {
      clearInterval(localTimers[id]);
      fetchItems(); // Refresh to see reverted status
    }
  }, 1000);
}

listForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const sellerName = document.getElementById('seller').value;

  await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, sellerName })
  });

  listForm.reset();
  document.getElementById('seller').value = sellerName; // keep seller name
  fetchItems();
});

async function claimItem(id) {
  const buyerName = currentUserInput.value.trim();
  if (!buyerName) {
    alert("Please enter a User Name to claim items");
    return;
  }

  try {
    const res = await fetch(`/api/items/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerName })
    });

    if (res.status === 409) {
      alert("Scenario 1 Triggered: Concurrency Collision. Item is no longer available!");
    } else if (!res.ok) {
      alert("Error claiming item");
    }
    
    fetchItems();
  } catch (err) {
    console.error(err);
  }
}

async function confirmHandoff(id) {
  await fetch(`/api/items/${id}/confirm`, { method: 'POST' });
  fetchItems();
}

async function removeItem(id) {
  await fetch(`/api/items/${id}/remove`, { method: 'POST' });
  fetchItems();
}

currentUserInput.addEventListener('input', renderItems);

// Initial fetch and auto-refresh every 2 seconds
fetchItems();
setInterval(fetchItems, 2000);
