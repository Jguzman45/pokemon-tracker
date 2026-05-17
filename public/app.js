document.addEventListener('DOMContentLoaded', () => {
  fetchInventory();
});

// FETCH AND RENDER (READ)
function fetchInventory() {
  const listContainer = document.getElementById('inventory-list');
  
  fetch('/api/items')
    .then(res => res.json())
    .then(items => {
      listContainer.innerHTML = '';
      
      if (items.length === 0) {
        listContainer.innerHTML = '<p>No items in inventory database yet.</p>';
        return;
      }

      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerHTML = `
          <div>
            <strong>${item.name}</strong> (${item.type})<br>
            <small>Quantity: <span id="qty-${item._id}">${item.quantity}</span></small>
          </div>
          <div class="actions">
            <button class="btn-update" onclick="incrementQuantity('${item._id}')">+1 Stock</button>
            <button class="btn-delete" onclick="deleteItem('${item._id}')">Delete</button>
          </div>
        `;
        listContainer.appendChild(itemDiv);
      });
    })
    .catch(err => {
      console.error('Error fetching inventory:', err);
      listContainer.innerHTML = '<p style="color:red;">Error fetching records.</p>';
    });
}

// INCREMENT QUANTITY (UPDATE)
window.incrementQuantity = function(id) {
  fetch(`/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => {
    if (!res.ok) throw new Error('Network error on update');
    return res.json();
  })
  .then(data => {
    // Optimistically update the single UI target node to limit unnecessary network queries
    const qtySpan = document.getElementById(`qty-${id}`);
    if (qtySpan && data.updatedItem) {
      qtySpan.innerText = data.updatedItem.quantity;
    } else {
      fetchInventory(); // Fallback reload
    }
  })
  .catch(err => console.error('Update operation failed:', err));
};

// REMOVE ENTRY (DELETE)
window.deleteItem = function(id) {
  if (!confirm('Are you sure you want to remove this item?')) return;

  fetch(`/api/items/${id}`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Network error on deletion');
    return res.json();
  })
  .then(() => {
    fetchInventory(); // Refresh the list view following confirmation
  })
  .catch(err => console.error('Delete operation failed:', err));
};
