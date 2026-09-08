document.addEventListener('DOMContentLoaded', () => {
  const equipmentList = document.getElementById('equipmentList');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMsg = document.getElementById('errorMsg');

  let debounceTimer;

  const STORAGE_KEY = 'smartrent_compare_items';

  function getCompareIds() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveCompareIds(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('compareUpdated'));
    updateDock();
  }

  // Floating Compare Dock Elements
  const compareDock = document.getElementById('compareDock');
  const dockCompareCount = document.getElementById('dockCompareCount');
  const dockThumbs = document.getElementById('dockThumbs');
  const dockClearBtn = document.getElementById('dockClearBtn');

  // Cache loaded equipment to easily grab thumbnail images
  let loadedEquipments = [];

  function updateDock() {
    if (!compareDock) return;
    const ids = getCompareIds();

    if (ids.length === 0) {
      compareDock.classList.remove('visible');
      return;
    }

    compareDock.classList.add('visible');
    dockCompareCount.textContent = `${ids.length}/4`;

    // Render thumbnails
    dockThumbs.innerHTML = '';
    ids.forEach(id => {
      const eq = loadedEquipments.find(item => item._id === id);
      const img = document.createElement('img');
      img.className = 'compare-dock-thumb';
      img.src = (eq && eq.images && eq.images.length > 0) ? eq.images[0] : 'https://via.placeholder.com/60x60?text=EQ';
      img.alt = eq ? eq.name : 'Equipment';
      img.title = eq ? eq.name : 'Equipment';
      dockThumbs.appendChild(img);
    });

    // Update button states on cards
    document.querySelectorAll('.btn-compare-toggle').forEach(btn => {
      const id = btn.getAttribute('data-id');
      const isSelected = ids.includes(id);
      btn.classList.toggle('selected', isSelected);
      btn.innerHTML = isSelected
        ? '✓ Added to Compare'
        : '+ Compare';
    });
  }

  if (dockClearBtn) {
    dockClearBtn.addEventListener('click', () => {
      saveCompareIds([]);
    });
  }

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
      loadedEquipments = result.data || [];
      renderEquipment(loadedEquipments);
      updateDock();
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

    const compareIds = getCompareIds();

    equipments.forEach(eq => {
      const card = document.createElement('div');
      card.className = 'card';
      const imageSrc = eq.images && eq.images.length > 0 ? eq.images[0] : 'https://via.placeholder.com/400x200?text=Equipment';
      const isComparing = compareIds.includes(eq._id);
      
      card.innerHTML = `
        <img src="${imageSrc}" alt="${eq.name}" class="card-img">
        <div class="card-body">
          <span class="badge">${eq.category}</span>
          <h3 class="card-title">${eq.name}</h3>
          <p class="mb-1" style="font-size: 0.875rem;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(eq.pricePerDay)} / day</p>
          <p class="mb-3" style="font-size: 0.875rem;">⭐ ${eq.rating.toFixed(1)}</p>
          <a href="equipment-details.html?id=${eq._id}" class="btn btn-outline" style="width: 100%; text-align: center; display: block;">View Details</a>
          <button type="button" class="btn-compare-toggle ${isComparing ? 'selected' : ''}" data-id="${eq._id}">
            ${isComparing ? '✓ Added to Compare' : '+ Compare'}
          </button>
        </div>
      `;
      equipmentList.appendChild(card);
    });

    // Wire compare buttons
    equipmentList.querySelectorAll('.btn-compare-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        let currentIds = getCompareIds();

        if (currentIds.includes(id)) {
          currentIds = currentIds.filter(item => item !== id);
        } else {
          if (currentIds.length >= 4) {
            alert('You can compare a maximum of 4 equipment items at a time.');
            return;
          }
          currentIds.push(id);
        }

        saveCompareIds(currentIds);
      });
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

  // Listen for compare updates from other sources
  window.addEventListener('compareUpdated', updateDock);

  // Initial load
  loadEquipment();
});

