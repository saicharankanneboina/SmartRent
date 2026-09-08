document.addEventListener('DOMContentLoaded', async () => {
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMsg = document.getElementById('errorMsg');
  const emptyState = document.getElementById('emptyState');
  const comparisonContainer = document.getElementById('comparisonContainer');
  const compareGrid = document.getElementById('compareGrid');
  const metricsBar = document.getElementById('metricsBar');
  const clearCompareBtn = document.getElementById('clearCompareBtn');

  const metricCount = document.getElementById('metricCount');
  const metricLowest = document.getElementById('metricLowest');
  const metricSpread = document.getElementById('metricSpread');
  const metricRating = document.getElementById('metricRating');

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
    // Trigger storage event so other open tabs/windows or navbar can update
    window.dispatchEvent(new Event('compareUpdated'));
  }

  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

  async function loadComparison() {
    const ids = getCompareIds();
    errorMsg.textContent = '';

    if (ids.length < 2) {
      loadingIndicator.classList.add('hidden');
      metricsBar.classList.add('hidden');
      comparisonContainer.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');
    comparisonContainer.classList.add('hidden');
    metricsBar.classList.add('hidden');

    try {
      const res = await apiCall('/equipment/compare', 'POST', { equipmentIds: ids });
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch comparison');
      }

      renderMetrics(res.metrics, res.count);
      renderGrid(res.data);
      metricsBar.classList.remove('hidden');
      comparisonContainer.classList.remove('hidden');
    } catch (err) {
      errorMsg.textContent = 'Error loading comparison: ' + err.message;
      emptyState.classList.remove('hidden');
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  function renderMetrics(metrics, count) {
    metricCount.textContent = `${count} items`;
    metricLowest.textContent = formatCurrency(metrics.lowestPrice);
    metricSpread.textContent = formatCurrency(metrics.priceDifference);
    metricRating.textContent = `⭐ ${metrics.highestRating ? metrics.highestRating.toFixed(1) : 'N/A'}`;
  }

  function renderGrid(items) {
    compareGrid.innerHTML = '';

    // Labels Column
    const labelCol = document.createElement('div');
    labelCol.className = 'compare-col';
    labelCol.innerHTML = `
      <div class="compare-header-cell spec-labels">
        <h4 style="margin: 0; color: var(--primary-color);">Specifications</h4>
        <span style="font-size: 0.8rem; color: var(--text-secondary);">Direct side-by-side metric comparison</span>
      </div>
      <div class="compare-row-cell label-cell">Category</div>
      <div class="compare-row-cell label-cell">Daily Rental Rate</div>
      <div class="compare-row-cell label-cell">Security Deposit (20%)</div>
      <div class="compare-row-cell label-cell">Estimated 3-Day Total</div>
      <div class="compare-row-cell label-cell">Estimated 7-Day Total</div>
      <div class="compare-row-cell label-cell">Customer Rating</div>
      <div class="compare-row-cell label-cell">Availability</div>
      <div class="compare-row-cell label-cell">Location</div>
      <div class="compare-row-cell label-cell">Owner</div>
      <div class="compare-row-cell label-cell">Action</div>
    `;
    compareGrid.appendChild(labelCol);

    // Equipment Columns
    items.forEach(item => {
      const col = document.createElement('div');
      col.className = 'compare-col';

      const imgSrc = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300x180?text=Equipment';
      const bestValueBadge = item.isLowestPrice ? '<span class="badge-best-value">Best Value</span>' : '';
      const topRatedBadge = item.isHighestRated ? '<span class="badge-top-rated">Top Rated</span>' : '';
      const availBadge = item.availability
        ? '<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">Available Now</span>'
        : '<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">Booked / Unavailable</span>';

      col.innerHTML = `
        <div class="compare-header-cell">
          <button class="compare-remove-btn" title="Remove from comparison" data-remove-id="${item._id}">×</button>
          <img src="${imgSrc}" alt="${item.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 0.75rem;">
          <h4 style="margin: 0 0 0.25rem 0; font-size: 1.05rem;">${item.name}</h4>
          <div>
            ${bestValueBadge}
            ${topRatedBadge}
          </div>
        </div>
        <div class="compare-row-cell">
          <span class="badge">${item.category}</span>
        </div>
        <div class="compare-row-cell font-bold" style="color: var(--primary-color); font-size: 1.1rem;">
          ${formatCurrency(item.pricePerDay)} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-secondary); margin-left: 0.25rem;">/ day</span>
        </div>
        <div class="compare-row-cell">
          ${formatCurrency(item.securityDeposit)}
        </div>
        <div class="compare-row-cell font-bold">
          ${formatCurrency(item.est3DayTotal)}
        </div>
        <div class="compare-row-cell font-bold" style="color: var(--secondary-color);">
          ${formatCurrency(item.est7DayTotal)}
        </div>
        <div class="compare-row-cell">
          ⭐ ${item.rating ? item.rating.toFixed(1) : 'No reviews'}
        </div>
        <div class="compare-row-cell">
          ${availBadge}
        </div>
        <div class="compare-row-cell">
          📍 ${item.location || 'Not specified'}
        </div>
        <div class="compare-row-cell">
          ${item.ownerId ? item.ownerId.name : 'Verified Owner'}
        </div>
        <div class="compare-row-cell">
          <a href="equipment-details.html?id=${item._id}" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.4rem 1rem; width: 90%;">Book / Details</a>
        </div>
      `;

      compareGrid.appendChild(col);
    });

    // Wire Remove Buttons
    compareGrid.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idToRemove = btn.getAttribute('data-remove-id');
        const currentIds = getCompareIds().filter(id => id !== idToRemove);
        saveCompareIds(currentIds);
        loadComparison();
      });
    });
  }

  // Clear all button handler
  if (clearCompareBtn) {
    clearCompareBtn.addEventListener('click', () => {
      saveCompareIds([]);
      loadComparison();
    });
  }

  // Load initial comparison
  loadComparison();
});
