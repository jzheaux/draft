// Popup script for GitHub Draft Issues extension

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const repoNameDiv = document.getElementById('repo-name');
    const draftCountDiv = document.getElementById('draft-count');
    
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Show status message
    function showStatus(message, type = 'success') {
        statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    }
    
    // Check if we're on a GitHub repository page
    function parseGitHubUrl(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname !== 'github.com') {
                return null;
            }
            
            const pathParts = urlObj.pathname.split('/').filter(part => part);
            if (pathParts.length >= 2) {
                return {
                    owner: pathParts[0],
                    repo: pathParts[1],
                    key: `${pathParts[0]}/${pathParts[1]}`
                };
            }
        } catch (error) {
            console.error('Error parsing URL:', error);
        }
        return null;
    }
    
    // Get draft count for repository
    async function getDraftCount(repoKey) {
        try {
            const result = await chrome.storage.local.get(['github_draft_issues']);
            const allDrafts = result.github_draft_issues || {};
            const repoDrafts = allDrafts[repoKey] || {};
            return Object.keys(repoDrafts).length;
        } catch (error) {
            console.error('Error getting draft count:', error);
            return 0;
        }
    }
    
    // Update repository info
    const repoInfo = parseGitHubUrl(tab.url);
    if (repoInfo) {
        repoNameDiv.textContent = repoInfo.key;
        const count = await getDraftCount(repoInfo.key);
        draftCountDiv.innerHTML = `<span class="draft-count">${count}</span> draft${count !== 1 ? 's' : ''}`;
        
        // Enable action buttons
        document.getElementById('create-draft').disabled = false;
        document.getElementById('view-drafts').disabled = false;
    } else {
        repoNameDiv.textContent = 'Not on a GitHub repository';
        draftCountDiv.textContent = '';
        
        // Disable action buttons
        document.getElementById('create-draft').disabled = true;
        document.getElementById('view-drafts').disabled = true;
    }
    
    // Create new draft button
    document.getElementById('create-draft').addEventListener('click', async () => {
        if (!repoInfo) return;
        
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'openDraftModal' });
            window.close();
        } catch (error) {
            // If content script isn't loaded, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-script.js']
                });
                
                // Wait a bit for script to load, then try again
                setTimeout(async () => {
                    try {
                        await chrome.tabs.sendMessage(tab.id, { action: 'openDraftModal' });
                        window.close();
                    } catch (e) {
                        showStatus('Please refresh the page and try again.', 'error');
                    }
                }, 100);
            } catch (e) {
                showStatus('Error: Cannot access this page.', 'error');
            }
        }
    });
    
    // View all drafts button
    document.getElementById('view-drafts').addEventListener('click', async () => {
        if (!repoInfo) return;
        
        try {
            // Navigate to drafts view
            const newUrl = `${tab.url.split('#')[0]}#drafts`;
            await chrome.tabs.update(tab.id, { url: newUrl });
            window.close();
        } catch (error) {
            showStatus('Error navigating to drafts.', 'error');
        }
    });
    
    // Export drafts button
    document.getElementById('export-drafts').addEventListener('click', async () => {
        try {
            const result = await chrome.storage.local.get(['github_draft_issues']);
            const drafts = result.github_draft_issues || {};
            
            const dataStr = JSON.stringify(drafts, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const timestamp = new Date().toISOString().split('T')[0];
            await chrome.downloads.download({
                url: url,
                filename: `github-draft-issues-${timestamp}.json`
            });
            
            showStatus('Drafts exported successfully!');
        } catch (error) {
            console.error('Error exporting drafts:', error);
            showStatus('Error exporting drafts.', 'error');
        }
    });
    
    // Import drafts button
    document.getElementById('import-drafts').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    
    // Handle file import
    document.getElementById('import-file').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const drafts = JSON.parse(text);
            
            // Validate the format
            if (typeof drafts !== 'object') {
                throw new Error('Invalid file format');
            }
            
            // Merge with existing drafts
            const result = await chrome.storage.local.get(['github_draft_issues']);
            const existingDrafts = result.github_draft_issues || {};
            
            // Merge the drafts
            Object.keys(drafts).forEach(repoKey => {
                if (!existingDrafts[repoKey]) {
                    existingDrafts[repoKey] = {};
                }
                Object.assign(existingDrafts[repoKey], drafts[repoKey]);
            });
            
            await chrome.storage.local.set({ github_draft_issues: existingDrafts });
            showStatus('Drafts imported successfully!');
            
            // Update draft count if on same repo
            if (repoInfo) {
                const count = await getDraftCount(repoInfo.key);
                draftCountDiv.innerHTML = `<span class="draft-count">${count}</span> draft${count !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            console.error('Error importing drafts:', error);
            showStatus('Error importing drafts. Please check the file format.', 'error');
        }
        
        // Clear the file input
        event.target.value = '';
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'draftCountUpdated') {
        // Update the draft count in popup if it's open
        const draftCountDiv = document.getElementById('draft-count');
        if (draftCountDiv && request.repoKey) {
            draftCountDiv.innerHTML = `<span class="draft-count">${request.count}</span> draft${request.count !== 1 ? 's' : ''}`;
        }
    }
});