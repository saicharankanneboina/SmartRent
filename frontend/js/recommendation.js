document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const aiPrompt = document.getElementById('aiPrompt');
  const useLocationBtn = document.getElementById('useLocationBtn');
  const locationStatus = document.getElementById('locationStatus');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMsg = document.getElementById('errorMsg');
  const resultsSection = document.getElementById('resultsSection');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');
  const equipmentGrid = document.getElementById('equipmentGrid');

  let userLat = null;
  let userLon = null;

  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        useLocationBtn.disabled = true;
        useLocationBtn.textContent = '⏳ Getting Location...';
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;
            useLocationBtn.disabled = false;
            useLocationBtn.textContent = '📍 Location Detected';
            if (locationStatus) locationStatus.style.display = 'none';
          },
          (error) => {
            useLocationBtn.disabled = false;
            useLocationBtn.textContent = '📍 Use My Location';
            alert('Location permission was not granted. You can continue without location.');
          }
        );
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    });
  }

  if (searchBtn && aiPrompt) {
    searchBtn.addEventListener('click', async () => {
      const prompt = aiPrompt.value.trim();
      if (!prompt) {
        errorMsg.textContent = 'Please enter a description of what you need.';
        return;
      }

      errorMsg.textContent = '';
      resultsSection.classList.add('hidden');
      loadingIndicator.classList.remove('hidden');
      searchBtn.disabled = true;

      try {
        const result = await apiCall('/recommendations/analyze', 'POST', {
          prompt,
          latitude: userLat,
          longitude: userLon,
          budget: null // Optional feature
        });

        renderAnalysis(result.analysis);
        if (result.recommendations.length === 0) {
          renderRecommendations([], result.message);
        } else {
          renderRecommendations(result.recommendations);
        }
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });

      } catch (err) {
        errorMsg.textContent = err.message || 'An error occurred during search.';
      } finally {
        loadingIndicator.classList.add('hidden');
        searchBtn.disabled = false;
      }
    });
  }

  function renderAnalysis(analysis) {
    aiAnalysisResult.innerHTML = `
      <div style="padding: 1rem;">
        <h3 style="font-size: 1.2rem; color: var(--primary-color); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">AI Understanding</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-color);">Task</strong></p>
            <p style="color: var(--text-secondary); font-size: 1rem; margin-bottom: 0;">${analysis.task}</p>
          </div>
          <div>
            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-color);">Project Type</strong></p>
            <p style="color: var(--text-secondary); font-size: 1rem; margin-bottom: 0;">${analysis.projectType} <span style="opacity: 0.7;">(${analysis.projectScale} scale)</span></p>
          </div>
          <div style="grid-column: span 2;">
            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-color);">Recommended Equipment</strong></p>
            <p style="color: var(--text-secondary); font-size: 1rem; margin-bottom: 0;">${analysis.primaryEquipmentType ? analysis.primaryEquipmentType : analysis.suggestedEquipmentTypes.join(', ')}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderRecommendations(equipments, message = null) {
    equipmentGrid.innerHTML = '';
    
    if (equipments.length === 0) {
      equipmentGrid.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 3rem; background: var(--bg-light); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <svg style="width: 48px; height: 48px; color: var(--text-secondary); margin: 0 auto 1rem auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h3 style="margin-bottom: 0.5rem; color: var(--text-color);">No matches found</h3>
        <p style="color: var(--text-secondary); font-size: 1.1rem;">${message || 'No suitable equipment found for your requirement.'}</p>
      </div>`;
      return;
    }

    equipments.forEach(eq => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const imageSrc = eq.images && eq.images.length > 0 ? eq.images[0] : 'assets/img/hero-bg.jpg';
      
      let explainHtml = '';
      if (eq.explanations && eq.explanations.length > 0) {
        explainHtml = `
          <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <p style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.05em; margin-bottom: 0.5rem; text-transform: uppercase;">Why Recommended</p>
            <p style="font-size: 0.875rem; font-weight: 600; color: var(--primary-color); margin-bottom: 0.75rem;">Score: ${eq.score}/100</p>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${eq.explanations.map(ex => `<div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">${ex}</div>`).join('')}
            </div>
          </div>
        `;
      }

      let badgesHtml = '';
      if (eq.badges && eq.badges.length > 0) {
        badgesHtml = eq.badges.map(b => `<span class="badge score-badge">${b}</span>`).join(' ');
      }

      const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(eq.pricePerDay);

      card.innerHTML = `
        <img src="${imageSrc}" alt="${eq.name}" class="card-img" onerror="this.onerror=null; this.src='assets/img/hero-bg.jpg';">
        <div class="card-body">
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            ${badgesHtml}
          </div>
          <span class="badge" style="margin-bottom: 0.75rem;">${eq.category}</span>
          <h3 class="card-title" style="margin-bottom: 0.5rem;">${eq.name}</h3>
          <p class="mb-2" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${formattedPrice} <span style="font-size: 0.875rem; font-weight: normal; color: var(--text-secondary);">/ day</span></p>
          <p class="mb-3" style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
            ⭐ ${eq.rating ? eq.rating.toFixed(1) : 'New'} 
            ${eq.location ? ` • 📍 ${eq.location}` : ''}
            ${eq.distanceKm !== undefined ? ` • 📍 ${eq.distanceKm < 1 ? Math.round(eq.distanceKm * 1000) + ' m away' : eq.distanceKm.toFixed(1) + ' km away'}` : ''}
          </p>
          
          <a href="equipment-details.html?id=${eq._id}" class="btn btn-primary" style="width: 100%; text-align: center; display: block;">View Details</a>
          
          ${explainHtml}
        </div>
      `;
      equipmentGrid.appendChild(card);
    });
  }
});
