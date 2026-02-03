document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading');
    const formEl = document.getElementById('job-form');
    const statusEl = document.getElementById('status-msg');

    // Try to inject script or send message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) return;

        // Send message to content script
        chrome.tabs.sendMessage(tabs[0].id, { action: "extract_job" }, (response) => {
            loadingEl.classList.add('hidden');

            if (chrome.runtime.lastError) {
                // Content script might not be loaded (e.g. restricted page or extension just installed)
                statusEl.innerText = "Could not connect to page. Refresh the page or ensure you are on a LinkedIn job page.";
                return;
            }

            if (response && response.status === "success") {
                const data = response.data;
                if (data.title || data.company) {
                    formEl.classList.remove('hidden');
                    document.getElementById('title').value = data.title || "";
                    document.getElementById('company').value = data.company || "";
                    document.getElementById('location').value = data.location || "";
                    document.getElementById('description').value = data.description || "";
                } else {
                    statusEl.innerText = "No job data found on this page.";
                }
            } else {
                statusEl.innerText = "Failed to extract data.";
            }
        });
    });

    document.getElementById('save-btn').addEventListener('click', async () => {
        const job = {
            title: document.getElementById('title').value,
            company: document.getElementById('company').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            url: window.location.href,
            source: 'LinkedIn'
        };

        console.log("Saving job:", job);
        statusEl.innerText = "Saving...";

        try {
            const response = await fetch('http://localhost:3001/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(job)
            });

            if (response.ok) {
                statusEl.innerText = "Job saved to database!";
                statusEl.style.color = '#28a745';
            } else {
                const error = await response.json();
                statusEl.innerText = error.error || "Failed to save job";
                statusEl.style.color = '#dc3545';
            }
        } catch (err) {
            console.error("Error saving job:", err);
            statusEl.innerText = "Backend not running. Start server first.";
            statusEl.style.color = '#dc3545';
        }

        setTimeout(() => {
            statusEl.innerText = "";
            statusEl.style.color = '#888';
        }, 4000);
    });
});
