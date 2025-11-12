document.addEventListener('DOMContentLoaded', () => {
    const startTrafficBtn = document.getElementById('startTrafficBtn');
    const stopTrafficBtn = document.getElementById('stopTrafficBtn');
    const trafficStatusSpan = document.getElementById('trafficStatus');
    const intervalInput = document.getElementById('intervalInput');
    const logTableBody = document.getElementById('logTableBody');
    const actionsChartCtx = document.getElementById('actionsChart').getContext('2d');
    const logsOverTimeChartCtx = document.getElementById('logsOverTimeChart').getContext('2d');

    let trafficInterval = 1000; // Default traffic generation interval
    let logPollingInterval = 2000; // Poll for new logs every 2 seconds
    let logPollingId;
    let logs = []; // Store logs for display and charts

    // Chart instances
    let actionsChart;
    let logsOverTimeChart;

    // Register the datalabels plugin
    Chart.register(ChartDataLabels);

    // Initialize Charts
    const initializeCharts = () => {
        actionsChart = new Chart(actionsChartCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
                        'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribution of User Actions'
                    },
                    datalabels: {
                        color: '#000', // Changed to black
                        font: {
                            weight: 'bold'
                        },
                        formatter: (value, context) => {
                            return value;
                        }
                    }
                }
            }
        });

        logsOverTimeChart = new Chart(logsOverTimeChartCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Logs per Minute',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Logs Processed Over Time (Last 5 Minutes)' // Updated title
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            tooltipFormat: 'HH:mm',
                            displayFormats: {
                                minute: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Logs'
                        }
                    }
                }
            }
        });
    };

    // Update Charts
    const updateCharts = () => {
        // Actions Distribution Chart
        const actionCounts = {};
        logs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });
        actionsChart.data.labels = Object.keys(actionCounts);
        actionsChart.data.datasets[0].data = Object.values(actionCounts);
        actionsChart.update();

        // Logs Over Time Chart (last 5 minutes)
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
        const logsInLastFiveMinutes = logs.filter(log => new Date(log.timestamp) > fiveMinutesAgo);

        const logsPerMinute = {};
        logsInLastFiveMinutes.forEach(log => {
            const minute = new Date(log.timestamp);
            minute.setSeconds(0);
            minute.setMilliseconds(0);
            const minuteKey = minute.toISOString();
            logsPerMinute[minuteKey] = (logsPerMinute[minuteKey] || 0) + 1;
        });

        const sortedMinutes = Object.keys(logsPerMinute).sort();
        logsOverTimeChart.data.labels = sortedMinutes;
        logsOverTimeChart.data.datasets[0].data = sortedMinutes.map(minute => logsPerMinute[minute]);
        logsOverTimeChart.update();
    };

    // Fetch logs from the API
    const fetchLogs = async () => {
        try {
            console.log('Fetching logs...');
            const response = await fetch('/logs?limit=50'); // Fetch latest 50 logs
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Logs fetched:', data);
            logs = data.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
            renderLogs();
            updateCharts();
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    // Render logs in the table
    const renderLogs = () => {
        logTableBody.innerHTML = ''; // Clear existing logs
        if (logs.length === 0) {
            const row = logTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = 'No logs found. Start traffic to generate data.';
            cell.style.textAlign = 'center';
            return;
        }
        logs.forEach(log => {
            const row = logTableBody.insertRow(0); // Insert at the top for newest first
            row.insertCell().textContent = new Date(log.timestamp).toLocaleString();
            row.insertCell().textContent = log.userId.substring(0, 8) + '...'; // Truncate for display
            row.insertCell().textContent = log.action;
            row.insertCell().textContent = log.metadata ? log.metadata.ip : 'N/A';
            row.insertCell().textContent = log.metadata ? log.metadata.device : 'N/A';
        });
    };

    // Control Traffic
    startTrafficBtn.addEventListener('click', async () => {
        try {
            trafficInterval = parseInt(intervalInput.value) || 1000;
            const response = await fetch(`/start-traffic?interval=${trafficInterval}`);
            if (response.ok) {
                trafficStatusSpan.textContent = 'Running';
                trafficStatusSpan.classList.remove('bg-warning', 'bg-danger');
                trafficStatusSpan.classList.add('bg-success');
                console.log(`Traffic started with interval ${trafficInterval}ms`);
            } else {
                console.error('Failed to start traffic');
            }
        } catch (error) {
            console.error('Error starting traffic:', error);
        }
    });

    stopTrafficBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/stop-traffic');
            if (response.ok) {
                trafficStatusSpan.textContent = 'Stopped';
                trafficStatusSpan.classList.remove('bg-success', 'bg-danger');
                trafficStatusSpan.classList.add('bg-warning');
                console.log('Traffic stopped');
            } else {
                console.error('Failed to stop traffic');
            }
        } catch (error) {
            console.error('Error stopping traffic:', error);
        }
    });

    // Initial setup
    initializeCharts();
    fetchLogs(); // Fetch logs immediately on load
    logPollingId = setInterval(fetchLogs, logPollingInterval); // Start polling for logs
});
