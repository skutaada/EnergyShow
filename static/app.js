let chart = null;
let currentData = null;

const loadingEl = document.getElementById('loading');
const dateSelectEl = document.getElementById('dateSelect');
const todayBtnEl = document.getElementById('todayBtn');
const tomorrowBtnEl = document.getElementById('tomorrowBtn');
const minPriceEl = document.getElementById('minPrice');
const maxPriceEl = document.getElementById('maxPrice');
const avgPriceEl = document.getElementById('avgPrice');
const datesListEl = document.getElementById('datesList');

function getTomorrowDateStr() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.getFullYear() + '-' +
        String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
        String(tomorrow.getDate()).padStart(2, '0');
}

function showLoading() {
    loadingEl.classList.add('active');
}

function hideLoading() {
    loadingEl.classList.remove('active');
}

function formatPrice(value) {
    return value.toFixed(2) + ' ct/kWh';
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('de-AT', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('de-AT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function updateStats(data) {
    if (!data || data.length === 0) {
        minPriceEl.textContent = '--';
        maxPriceEl.textContent = '--';
        avgPriceEl.textContent = '--';
        return;
    }

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    minPriceEl.textContent = formatPrice(min);
    maxPriceEl.textContent = formatPrice(max);
    avgPriceEl.textContent = formatPrice(avg);
}

function showNoDataMessage(date) {
    const container = document.getElementById('priceChart').parentElement;

    if (chart) {
        chart.destroy();
        chart = null;
    }

    const canvas = document.getElementById('priceChart');
    canvas.style.display = 'none';

    let noDataEl = document.getElementById('noDataMessage');
    if (!noDataEl) {
        noDataEl = document.createElement('div');
        noDataEl.id = 'noDataMessage';
        noDataEl.className = 'no-data-message';
        container.appendChild(noDataEl);
    }
    noDataEl.innerHTML = `<p>No prices available for ${formatDate(date)}</p>`;
    noDataEl.style.display = 'flex';

    updateStats([]);
}

function hideNoDataMessage() {
    const canvas = document.getElementById('priceChart');
    canvas.style.display = 'block';

    const noDataEl = document.getElementById('noDataMessage');
    if (noDataEl) {
        noDataEl.style.display = 'none';
    }
}

function createChart(data) {
    hideNoDataMessage();
    const ctx = document.getElementById('priceChart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    const labels = data.map(d => new Date(d.timestamp));
    const values = data.map(d => d.value);

    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price (ct/kWh)',
                data: values,
                borderColor: '#00d4ff',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#00d4ff',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a1a2e',
                    titleColor: '#eaeaea',
                    bodyColor: '#00d4ff',
                    borderColor: '#2a2a4a',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const timestamp = context[0].parsed.x;
                            return formatTime(new Date(timestamp));
                        },
                        label: function(context) {
                            return formatPrice(context.raw);
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0a0a0',
                        maxRotation: 0
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0a0a0',
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    }
                }
            }
        }
    });
}

async function fetchTodayPrices() {
    showLoading();
    try {
        const response = await fetch('/api/prices/today');
        if (!response.ok) throw new Error('Failed to fetch prices');
        const data = await response.json();
        currentData = data;
        createChart(data.data);
        updateStats(data.data);

        if (data.data.length > 0) {
            const firstDate = new Date(data.data[0].timestamp);
            const dateStr = firstDate.getFullYear() + '-' +
                String(firstDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(firstDate.getDate()).padStart(2, '0');
            dateSelectEl.value = dateStr;
            updateActiveDateTag(dateStr);
        }
    } catch (error) {
        console.error('Error fetching today prices:', error);
        alert('Failed to load prices. Please try again.');
    } finally {
        hideLoading();
    }
}

async function fetchPricesForDate(date) {
    showLoading();
    try {
        const response = await fetch(`/api/prices?start_date=${date}&end_date=${date}`);
        if (!response.ok) {
            if (response.status === 404) {
                showNoDataMessage(date);
                updateActiveDateTag(date);
                return;
            }
            throw new Error('Failed to fetch prices');
        }
        const data = await response.json();
        currentData = data;
        createChart(data.data);
        updateStats(data.data);
        updateActiveDateTag(date);
    } catch (error) {
        console.error('Error fetching prices:', error);
        alert('Failed to load prices. Please try again.');
    } finally {
        hideLoading();
    }
}

async function fetchAvailableDates() {
    try {
        const response = await fetch('/api/prices/dates');
        if (!response.ok) throw new Error('Failed to fetch dates');
        const data = await response.json();
        renderDatesList(data.dates);
        updateTomorrowButton(data.dates);
    } catch (error) {
        console.error('Error fetching available dates:', error);
    }
}

function updateTomorrowButton(availableDates) {
    const tomorrowStr = getTomorrowDateStr();
    const hasTomorrow = availableDates.includes(tomorrowStr);
    tomorrowBtnEl.disabled = !hasTomorrow;
}

function renderDatesList(dates) {
    datesListEl.innerHTML = '';
    dates.forEach(date => {
        const tag = document.createElement('span');
        tag.className = 'date-tag';
        tag.textContent = formatDate(date);
        tag.dataset.date = date;
        tag.addEventListener('click', () => {
            dateSelectEl.value = date;
            fetchPricesForDate(date);
        });
        datesListEl.appendChild(tag);
    });
}

function updateActiveDateTag(date) {
    document.querySelectorAll('.date-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.date === date);
    });
}

dateSelectEl.addEventListener('change', (e) => {
    if (e.target.value) {
        fetchPricesForDate(e.target.value);
    }
});

todayBtnEl.addEventListener('click', () => {
    fetchTodayPrices().then(() => fetchAvailableDates());
});

tomorrowBtnEl.addEventListener('click', () => {
    const tomorrowStr = getTomorrowDateStr();
    fetchPricesForDate(tomorrowStr);
});

// Initial load
fetchTodayPrices().then(() => fetchAvailableDates());
