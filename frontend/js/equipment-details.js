document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const eqId = urlParams.get('id');

  const loadingIndicator = document.getElementById('loadingIndicator');
  const equipmentDetails = document.getElementById('equipmentDetails');
  const errorMsg = document.getElementById('errorMsg');
  const bookingForm = document.getElementById('bookingForm');
  
  let currentEquipment = null;

  if (!eqId) {
    errorMsg.textContent = 'No equipment specified.';
    loadingIndicator.classList.add('hidden');
    return;
  }

  try {
    const result = await apiCall(`/equipment/${eqId}`);
    currentEquipment = result.data;
    renderDetails(currentEquipment);
    equipmentDetails.classList.remove('hidden');
  } catch (err) {
    errorMsg.textContent = 'Failed to load details: ' + err.message;
  } finally {
    loadingIndicator.classList.add('hidden');
  }

  function renderDetails(eq) {
    document.getElementById('eqName').textContent = eq.name;
    document.getElementById('eqCategory').textContent = eq.category;
    document.getElementById('eqPrice').textContent = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(eq.pricePerDay);
    document.getElementById('eqLocation').textContent = eq.location;
    document.getElementById('eqRating').textContent = eq.rating.toFixed(1);
    document.getElementById('eqDesc').textContent = eq.description;
    
    const img = document.getElementById('eqImage');
    img.src = eq.images && eq.images.length > 0 ? eq.images[0] : 'https://via.placeholder.com/600x400?text=Equipment';

    if (!eq.availability) {
      document.getElementById('bookBtn').disabled = true;
      document.getElementById('bookBtn').textContent = 'Currently Unavailable';
    }

    // Set min date for dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
  }

  // Cost calculation
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  function calculateCost() {
    if (!currentEquipment) return;
    
    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    
    if (isNaN(start) || isNaN(end) || start > end) {
      document.getElementById('costDisplay').textContent = '₹0';
      document.getElementById('depositDisplay').textContent = '₹0';
      document.getElementById('totalDisplay').textContent = '₹0';
      return;
    }
    
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const cost = days * currentEquipment.pricePerDay;
    const deposit = cost * 0.2;
    const total = cost + deposit;
    
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    document.getElementById('costDisplay').textContent = formatter.format(cost);
    document.getElementById('depositDisplay').textContent = formatter.format(deposit);
    document.getElementById('totalDisplay').textContent = formatter.format(total);
  }

  startDateInput.addEventListener('change', calculateCost);
  endDateInput.addEventListener('change', calculateCost);

  // Booking Flow
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
      }

      const user = getUser();
      if (user.role !== 'Renter') {
        document.getElementById('bookingError').textContent = 'Only renters can book equipment.';
        return;
      }

      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      const paymentMethod = document.getElementById('paymentMethod').value;

      document.getElementById('bookBtn').disabled = true;
      document.getElementById('bookingError').textContent = '';

      try {
        if (paymentMethod === 'Online Payment') {
          // Show simulated payment modal
          const modal = document.getElementById('paymentModal');
          modal.classList.add('active');
          
          // Simulate network request
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          document.getElementById('paymentSpinner').classList.add('hidden');
          document.getElementById('paymentSuccess').classList.remove('hidden');
          
          document.getElementById('closePaymentBtn').addEventListener('click', async () => {
             // Create booking after payment success visually
             await createBookingRequest(startDate, endDate, paymentMethod);
          });
        } else {
          await createBookingRequest(startDate, endDate, paymentMethod);
        }
      } catch (err) {
        document.getElementById('bookingError').textContent = err.message;
        document.getElementById('bookBtn').disabled = false;
        document.getElementById('paymentModal').classList.remove('active');
      }
    });
  }

  async function createBookingRequest(startDate, endDate, paymentMethod) {
    const result = await apiCall('/bookings', 'POST', {
      equipmentId: eqId,
      startDate,
      endDate,
      paymentMethod
    });
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  }
});
