// Calendar integrated with backend API

// Check authentication
if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

const calendarEl = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
let events = [];
let projects = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDateKey = null;

document.addEventListener('DOMContentLoaded', async function() {
  await loadProjects();
  await loadEvents();
  renderCalendar(currentMonth, currentYear);
  setupEventListeners();
});

async function loadProjects() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      projects = await response.json();
      populateProjectDropdown();
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

function populateProjectDropdown() {
  const projectSelect = document.getElementById('eventProject');
  if (!projectSelect) return;
  
  // Clear existing options except the first one
  projectSelect.innerHTML = '<option value="">Select project (optional)</option>';
  
  projects.forEach(project => {
    const option = document.createElement('option');
    option.value = project._id;
    option.textContent = project.title;
    projectSelect.appendChild(option);
  });
}

async function loadEvents() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/events', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      events = await response.json();
      console.log('Loaded events:', events.length);
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

function setupEventListeners() {
  document.getElementById("prev").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) { 
      currentMonth = 11; 
      currentYear--; 
    }
    renderCalendar(currentMonth, currentYear);
  });

  document.getElementById("next").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) { 
      currentMonth = 0; 
      currentYear++; 
    }
    renderCalendar(currentMonth, currentYear);
  });

  document.getElementById("saveEvent").addEventListener("click", saveEvent);
}

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(month, year) {
  return new Date(year, month, 1).getDay();
}

function renderCalendar(month, year) {
  calendarEl.innerHTML = "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  dayNames.forEach(day => {
    const dayEl = document.createElement("div");
    dayEl.classList.add("day-name");
    dayEl.innerText = day;
    calendarEl.appendChild(dayEl);
  });

  monthYear.innerText = new Date(year, month).toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const firstDay = firstDayOfMonth(month, year);
  const totalDays = daysInMonth(month, year);

  // Add empty cells for days before the first day
  for (let i = 0; i < firstDay; i++) {
    calendarEl.appendChild(document.createElement("div"));
  }

  // Add day cells
  for (let day = 1; day <= totalDays; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if it's today
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayDiv.classList.add("today");
    }
    
    dayDiv.innerHTML = `<span>${day}</span>`;
    
    // Find events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year;
    });
    
    // Display events or event count
    if (dayEvents.length > 0) {
      if (dayEvents.length === 1) {
        // Show single event
        const eventSpan = document.createElement("span");
        eventSpan.classList.add("event");
        eventSpan.textContent = dayEvents[0].title;
        eventSpan.title = `${dayEvents[0].title}\n${dayEvents[0].description || ''}\n${dayEvents[0].time || 'All day'}`;
        
        // Click to view event details
        eventSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          viewEventDetails(dayEvents[0]);
        });
        
        dayDiv.appendChild(eventSpan);
      } else {
        // Show count badge for multiple events
        const countBadge = document.createElement("div");
        countBadge.classList.add("event-count-badge");
        countBadge.textContent = `${dayEvents.length} events`;
        countBadge.style.cssText = `
          background: linear-gradient(135deg, #3b3b63, #52528c);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          margin-top: 3px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        // Click to view all events
        countBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          viewAllEvents(dateStr, dayEvents);
        });
        
        dayDiv.appendChild(countBadge);
        
        // Also show first event title
        const firstEventSpan = document.createElement("span");
        firstEventSpan.classList.add("event");
        firstEventSpan.textContent = dayEvents[0].title;
        firstEventSpan.style.fontSize = "10px";
        
        firstEventSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          viewAllEvents(dateStr, dayEvents);
        });
        
        dayDiv.appendChild(firstEventSpan);
      }
    }
    
    // Add click event to create new event
    dayDiv.addEventListener("click", () => openModal(dateStr));
    calendarEl.appendChild(dayDiv);
  }
}

function openModal(dateKey) {
  selectedDateKey = dateKey;
  const modal = new bootstrap.Modal(document.getElementById("eventModal"));
  
  // Clear form
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDescription").value = "";
  document.getElementById("eventProject").value = "";
  document.getElementById("eventTime").value = "";
  
  modal.show();
}

async function saveEvent() {
  const title = document.getElementById("eventTitle").value.trim();
  const description = document.getElementById("eventDescription").value.trim();
  const projectId = document.getElementById("eventProject").value;
  const time = document.getElementById("eventTime").value;
  
  if (!title) {
    alert('Please enter an event title');
    return;
  }
  
  if (!selectedDateKey) {
    alert('Please select a date');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        date: selectedDateKey,
        time,
        project: projectId || undefined
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Event created:', result);
      
      // Show notification status
      let message = '✅ Event created successfully!';
      if (result.emailNotifications && result.emailNotifications.sent.length > 0) {
        message += `\n\n📧 Notifications sent to ${result.emailNotifications.sent.length} member(s)`;
      }
      if (result.emailNotifications && result.emailNotifications.failed.length > 0) {
        message += `\n\n⚠️ Failed to notify ${result.emailNotifications.failed.length} member(s)`;
      }
      
      alert(message);
      
      // Reload events and calendar
      await loadEvents();
      renderCalendar(currentMonth, currentYear);
      
      // Close modal
      const modalEl = document.getElementById("eventModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    } else {
      const error = await response.json();
      alert(`❌ Failed to create event: ${error.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating event:', error);
    alert('❌ Error creating event. Please try again.');
  }
}

function viewEventDetails(event) {
  const projectName = event.project?.title || 'General';
  const details = `
📅 ${event.title}

📋 Description: ${event.description || 'No description'}
📁 Project: ${projectName}
⏰ Time: ${event.time || 'All day'}
📆 Date: ${new Date(event.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
👤 Created by: ${event.createdBy?.name || event.createdBy?.email || 'Unknown'}
  `;
  
  alert(details);
}

function viewAllEvents(dateStr, dayEvents) {
  const modal = new bootstrap.Modal(document.getElementById("viewEventsModal"));
  const container = document.getElementById("eventsListContainer");
  
  // Format the date for display
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  document.getElementById("viewEventsTitle").textContent = `Events on ${formattedDate}`;
  
  // Clear container
  container.innerHTML = '';
  
  // Sort events by time
  dayEvents.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
  
  // Display each event as a card
  dayEvents.forEach((event, index) => {
    const eventCard = document.createElement('div');
    eventCard.className = 'card mb-3';
    eventCard.style.borderLeft = '4px solid #3b3b63';
    
    const projectName = event.project?.title || 'General';
    const creatorName = event.createdBy?.name || event.createdBy?.email || 'Unknown';
    
    eventCard.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div style="flex: 1;">
            <h6 class="card-title mb-2">
              ${event.title}
            </h6>
            ${event.description ? `<p class="card-text text-muted mb-2"><small>${event.description}</small></p>` : ''}
            <div class="d-flex flex-wrap gap-3 mt-2">
              <span class="badge bg-secondary">
                ${event.time || 'All day'}
              </span>
              <span class="badge bg-info">
                ${projectName}
              </span>
              <span class="badge bg-light text-dark">
                ${creatorName}
              </span>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteEvent('${event._id}')" title="Delete event">
            Delete
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(eventCard);
  });
  
  // Store the date for "Add Another Event" button
  document.getElementById("addAnotherEvent").onclick = function() {
    // Close view modal
    bootstrap.Modal.getInstance(document.getElementById("viewEventsModal")).hide();
    // Open create modal
    openModal(dateStr);
  };
  
  modal.show();
}

async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('✅ Event deleted successfully!');
      
      // Reload events and calendar
      await loadEvents();
      renderCalendar(currentMonth, currentYear);
      
      // Close the view events modal
      const modalEl = document.getElementById("viewEventsModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    } else {
      const error = await response.json();
      alert(`❌ Failed to delete event: ${error.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    alert('❌ Error deleting event. Please try again.');
  }
}