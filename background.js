// Background service worker for GitHub Draft Issues extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('GitHub Draft Issues extension installed');
    }
});

// Handle hash navigation for drafts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url.includes('github.com') && tab.url.includes('#drafts')) {
        // Inject content script if needed
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
        }).catch(() => {
            // Script may already be injected, ignore error
        });
    }
});

// Storage management utilities
const StorageManager = {
    // Clean up old drafts (optional maintenance)
    async cleanupOldDrafts() {
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - THIRTY_DAYS);
        
        try {
            const result = await chrome.storage.local.get(['github_draft_issues']);
            const allDrafts = result.github_draft_issues || {};
            
            let hasChanges = false;
            
            Object.keys(allDrafts).forEach(repoKey => {
                const repoDrafts = allDrafts[repoKey];
                Object.keys(repoDrafts).forEach(draftId => {
                    const draft = repoDrafts[draftId];
                    const draftDate = new Date(draft.updatedAt || draft.createdAt);
                    
                    if (draftDate < cutoffDate) {
                        delete repoDrafts[draftId];
                        hasChanges = true;
                    }
                });
                
                // Remove empty repo entries
                if (Object.keys(repoDrafts).length === 0) {
                    delete allDrafts[repoKey];
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                await chrome.storage.local.set({ github_draft_issues: allDrafts });
                console.log('Cleaned up old drafts');
            }
        } catch (error) {
            console.error('Error cleaning up drafts:', error);
        }
    },
    
    // Export drafts (for backup)
    async exportDrafts() {
        try {
            const result = await chrome.storage.local.get(['github_draft_issues']);
            return result.github_draft_issues || {};
        } catch (error) {
            console.error('Error exporting drafts:', error);
            return {};
        }
    },
    
    // Import drafts (for restore)
    async importDrafts(draftsData) {
        try {
            await chrome.storage.local.set({ github_draft_issues: draftsData });
            return true;
        } catch (error) {
            console.error('Error importing drafts:', error);
            return false;
        }
    }
};

// Run cleanup once a day
chrome.alarms.create('cleanupDrafts', { periodInMinutes: 1440 }); // 24 hours

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupDrafts') {
        StorageManager.cleanupOldDrafts();
    }
});

// Message handling for communication with content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'exportDrafts':
            StorageManager.exportDrafts().then(sendResponse);
            return true; // Indicates async response
            
        case 'importDrafts':
            StorageManager.importDrafts(request.data).then(sendResponse);
            return true;
            
        case 'cleanupDrafts':
            StorageManager.cleanupOldDrafts().then(() => sendResponse(true));
            return true;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});