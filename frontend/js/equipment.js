document.addEventListener('DOMContentLoaded', () => {
  const equipmentList = document.getElementById('equipmentList');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMsg = document.getElementById('errorMsg');

  let debounceTimer;

  async function loadEquipment() {
    if (!equipmentList) return;
    
    equipmentList.innerHTML = '';
    loadingIndicator.classList.remove('hidden');
    errorMsg.textContent = '';
    
    const search = searchInput ? searchInput.value : '';
    const category = categoryFilter ? categoryFilter.value : '';
    
    let url = '/equipment?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;

    try {
      const result = await apiCall(url);
      renderEquipment(result.data);
    } catch (err) {
      errorMsg.textContent = 'Failed to load equipment: ' + err.message;
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  function renderEquipment(equipments) {
    equipmentList.innerHTML = '';
    if (equipments.length === 0) {
      equipmentList.innerHTML = '<p class="col-span-full text-center" style="font-size: 1.125rem; color: var(--text-secondary); padding: 3rem 0;">No equipment listings are available at the moment. Please check back later.</p>';
      return;
    }

    equipments.forEach(eq => {
      const card = document.createElement('div');
      card.className = 'card';
      const imageSrc = eq.images && eq.images.length > 0 ? eq.images[0] : 'https://via.placeholder.com/400x200?text=Equipment';
      
      card.innerHTML = `
        <img src="${imageSrc}" alt="${eq.name}" class="card-img">
        <div class="card-body">
          <span class="badge">${eq.category}</span>
          <h3 class="card-title">${eq.name}</h3>
          <p class="mb-1" style="font-size: 0.875rem;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(eq.pricePerDay)} / day</p>
          <p class="mb-3" style="font-size: 0.875rem;">⭐ ${eq.rating.toFixed(1)}</p>
          <a href="equipment-details.html?id=${eq._id}" class="btn btn-outline" style="width: 100%; text-align: center; display: block;">View Details</a>
        </div>
      `;
      equipmentList.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadEquipment, 500);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', loadEquipment);
  }

  // Initial load
  loadEquipment();
});
