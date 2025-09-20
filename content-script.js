// Content script for GitHub Draft Issues extension
(function() {
    'use strict';

    // Draft storage manager
    const DraftManager = {
        STORAGE_KEY: 'github_draft_issues',
        
        // Get all drafts for current repository
        async getDrafts() {
            const result = await chrome.storage.local.get([this.STORAGE_KEY]);
            const allDrafts = result[this.STORAGE_KEY] || {};
            const repoKey = this.getCurrentRepoKey();
            return allDrafts[repoKey] || {};
        },
        
        // Save a draft
        async saveDraft(id, draftData) {
            const result = await chrome.storage.local.get([this.STORAGE_KEY]);
            const allDrafts = result[this.STORAGE_KEY] || {};
            const repoKey = this.getCurrentRepoKey();
            
            if (!allDrafts[repoKey]) {
                allDrafts[repoKey] = {};
            }
            
            allDrafts[repoKey][id] = {
                ...draftData,
                id: id,
                repository: repoKey,
                updatedAt: new Date().toISOString()
            };
            
            await chrome.storage.local.set({ [this.STORAGE_KEY]: allDrafts });
            return allDrafts[repoKey][id];
        },
        
        // Delete a draft
        async deleteDraft(id) {
            const result = await chrome.storage.local.get([this.STORAGE_KEY]);
            const allDrafts = result[this.STORAGE_KEY] || {};
            const repoKey = this.getCurrentRepoKey();
            
            if (allDrafts[repoKey] && allDrafts[repoKey][id]) {
                delete allDrafts[repoKey][id];
                await chrome.storage.local.set({ [this.STORAGE_KEY]: allDrafts });
                return true;
            }
            return false;
        },
        
        // Get current repository key
        getCurrentRepoKey() {
            const pathParts = window.location.pathname.split('/').filter(part => part);
            if (pathParts.length >= 2) {
                return `${pathParts[0]}/${pathParts[1]}`;
            }
            return 'unknown';
        },
        
        // Generate unique ID for draft
        generateDraftId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    };

    // UI Manager for creating and managing draft interface
    const UIManager = {
        // Add Draft Issue button to GitHub UI
        addDraftButton() {
            // Look for the "New Issue" button
            const newIssueButton = document.querySelector('a[href$="/issues/new"]');
            if (!newIssueButton || document.querySelector('.draft-issue-btn')) {
                return; // Button already exists or new issue button not found
            }

            // Create the Draft Issue button
            const draftButton = document.createElement('a');
            draftButton.className = 'btn btn-primary draft-issue-btn';
            draftButton.href = '#';
            draftButton.textContent = 'Draft Issue';
            draftButton.style.marginLeft = '8px';
            
            draftButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.openDraftModal();
            });

            // Insert the button next to the New Issue button
            newIssueButton.parentNode.insertBefore(draftButton, newIssueButton.nextSibling);
        },
        
        // Open draft creation modal
        openDraftModal(existingDraft = null) {
            const modalId = 'draft-issue-modal';
            
            // Remove existing modal if present
            const existingModal = document.getElementById(modalId);
            if (existingModal) {
                existingModal.remove();
            }
            
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'draft-modal-overlay';
            
            const isEdit = existingDraft !== null;
            const title = existingDraft ? existingDraft.title || '' : '';
            const body = existingDraft ? existingDraft.body || '' : '';
            
            modal.innerHTML = `
                <div class="draft-modal">
                    <div class="draft-modal-header">
                        <h3>${isEdit ? 'Edit' : 'Create'} Draft Issue</h3>
                        <button class="draft-modal-close">&times;</button>
                    </div>
                    <div class="draft-modal-body">
                        <div class="form-group">
                            <label for="draft-title">Title</label>
                            <input type="text" id="draft-title" class="form-control" value="${title}" placeholder="Issue title">
                        </div>
                        <div class="form-group">
                            <label for="draft-body">Description</label>
                            <textarea id="draft-body" class="form-control" rows="10" placeholder="Issue description">${body}</textarea>
                        </div>
                    </div>
                    <div class="draft-modal-footer">
                        <button class="btn btn-secondary draft-modal-cancel">Cancel</button>
                        <button class="btn btn-primary draft-modal-save">${isEdit ? 'Update' : 'Save'} Draft</button>
                        ${isEdit ? '<button class="btn btn-danger draft-modal-delete">Delete Draft</button>' : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            modal.querySelector('.draft-modal-close').addEventListener('click', () => modal.remove());
            modal.querySelector('.draft-modal-cancel').addEventListener('click', () => modal.remove());
            modal.querySelector('.draft-modal-save').addEventListener('click', () => this.saveDraft(modal, existingDraft));
            
            if (isEdit) {
                modal.querySelector('.draft-modal-delete').addEventListener('click', () => this.deleteDraft(modal, existingDraft));
            }
            
            // Close modal when clicking overlay
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Focus on title input
            modal.querySelector('#draft-title').focus();
        },
        
        // Save draft from modal
        async saveDraft(modal, existingDraft) {
            const titleInput = modal.querySelector('#draft-title');
            const bodyInput = modal.querySelector('#draft-body');
            
            const title = titleInput.value.trim();
            const body = bodyInput.value.trim();
            
            if (!title) {
                alert('Please enter a title for the draft issue.');
                titleInput.focus();
                return;
            }
            
            const draftId = existingDraft ? existingDraft.id : DraftManager.generateDraftId();
            const draftData = {
                title,
                body,
                createdAt: existingDraft ? existingDraft.createdAt : new Date().toISOString()
            };
            
            try {
                await DraftManager.saveDraft(draftId, draftData);
                modal.remove();
                
                // Refresh drafts view if we're currently viewing drafts
                if (window.location.hash.startsWith('#drafts')) {
                    this.showDraftsView();
                }
                
                // Show success message
                this.showNotification(`Draft ${existingDraft ? 'updated' : 'saved'} successfully!`);
            } catch (error) {
                console.error('Error saving draft:', error);
                alert('Error saving draft. Please try again.');
            }
        },
        
        // Delete draft
        async deleteDraft(modal, draft) {
            if (confirm('Are you sure you want to delete this draft?')) {
                try {
                    await DraftManager.deleteDraft(draft.id);
                    modal.remove();
                    
                    // Refresh drafts view if we're currently viewing drafts
                    if (window.location.hash.startsWith('#drafts')) {
                        this.showDraftsView();
                    }
                    
                    this.showNotification('Draft deleted successfully!');
                } catch (error) {
                    console.error('Error deleting draft:', error);
                    alert('Error deleting draft. Please try again.');
                }
            }
        },
        
        // Show notification message
        showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'draft-notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        },
        
        // Show drafts view
        async showDraftsView() {
            const drafts = await DraftManager.getDrafts();
            const isSpecificDraft = window.location.hash.startsWith('#drafts/');
            
            if (isSpecificDraft) {
                const draftId = window.location.hash.substring(8); // Remove '#drafts/'
                const draft = drafts[draftId];
                if (draft) {
                    this.showSingleDraft(draft);
                } else {
                    this.showDraftNotFound(draftId);
                }
            } else {
                this.showAllDrafts(drafts);
            }
        },
        
        // Show all drafts
        showAllDrafts(drafts) {
            const mainContent = document.querySelector('#js-repo-pjax-container, .container-xl');
            if (!mainContent) return;
            
            const draftEntries = Object.values(drafts);
            const repoKey = DraftManager.getCurrentRepoKey();
            
            const draftsHTML = `
                <div class="drafts-container">
                    <div class="Box">
                        <div class="Box-header">
                            <h3 class="Box-title">
                                Draft Issues for ${repoKey}
                                <span class="Counter">${draftEntries.length}</span>
                            </h3>
                            <button class="btn btn-primary btn-sm" id="new-draft-btn">New Draft</button>
                        </div>
                        ${draftEntries.length === 0 ? `
                            <div class="Box-body">
                                <div class="blankslate">
                                    <h3 class="blankslate-heading">No draft issues yet</h3>
                                    <p>Create your first draft issue to get started.</p>
                                    <button class="btn btn-primary" id="create-first-draft">Create Draft Issue</button>
                                </div>
                            </div>
                        ` : `
                            <div class="Box-body">
                                ${draftEntries.map(draft => `
                                    <div class="Box-row draft-item" data-draft-id="${draft.id}">
                                        <div class="d-flex">
                                            <div class="flex-auto">
                                                <h4 class="draft-title">
                                                    <a href="#drafts/${draft.id}">${draft.title}</a>
                                                </h4>
                                                <p class="draft-meta text-small color-fg-muted">
                                                    Created ${new Date(draft.createdAt).toLocaleDateString()}
                                                    ${draft.updatedAt && draft.updatedAt !== draft.createdAt ? 
                                                        `• Updated ${new Date(draft.updatedAt).toLocaleDateString()}` : ''}
                                                </p>
                                                ${draft.body ? `
                                                    <p class="draft-preview">${draft.body.substring(0, 200)}${draft.body.length > 200 ? '...' : ''}</p>
                                                ` : ''}
                                            </div>
                                            <div class="draft-actions">
                                                <button class="btn btn-sm edit-draft-btn" data-draft-id="${draft.id}">Edit</button>
                                                <button class="btn btn-sm btn-danger delete-draft-btn" data-draft-id="${draft.id}">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = draftsHTML;
            
            // Add event listeners
            document.getElementById('new-draft-btn')?.addEventListener('click', () => this.openDraftModal());
            document.getElementById('create-first-draft')?.addEventListener('click', () => this.openDraftModal());
            
            document.querySelectorAll('.edit-draft-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const draftId = e.target.dataset.draftId;
                    const draft = drafts[draftId];
                    this.openDraftModal(draft);
                });
            });
            
            document.querySelectorAll('.delete-draft-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const draftId = e.target.dataset.draftId;
                    if (confirm('Are you sure you want to delete this draft?')) {
                        try {
                            await DraftManager.deleteDraft(draftId);
                            this.showDraftsView(); // Refresh view
                            this.showNotification('Draft deleted successfully!');
                        } catch (error) {
                            console.error('Error deleting draft:', error);
                            alert('Error deleting draft. Please try again.');
                        }
                    }
                });
            });
        },
        
        // Show single draft
        showSingleDraft(draft) {
            const mainContent = document.querySelector('#js-repo-pjax-container, .container-xl');
            if (!mainContent) return;
            
            const repoKey = DraftManager.getCurrentRepoKey();
            
            const draftHTML = `
                <div class="draft-single-container">
                    <nav class="breadcrumb">
                        <a href="#drafts">← Back to drafts</a>
                    </nav>
                    <div class="Box">
                        <div class="Box-header">
                            <div class="d-flex">
                                <div class="flex-auto">
                                    <h3 class="Box-title">${draft.title}</h3>
                                    <p class="text-small color-fg-muted">
                                        Draft for ${repoKey} • Created ${new Date(draft.createdAt).toLocaleDateString()}
                                        ${draft.updatedAt && draft.updatedAt !== draft.createdAt ? 
                                            ` • Updated ${new Date(draft.updatedAt).toLocaleDateString()}` : ''}
                                    </p>
                                </div>
                                <div class="draft-actions">
                                    <button class="btn btn-sm" id="edit-single-draft">Edit</button>
                                    <button class="btn btn-sm btn-danger" id="delete-single-draft">Delete</button>
                                </div>
                            </div>
                        </div>
                        <div class="Box-body">
                            ${draft.body ? `
                                <div class="draft-body">
                                    ${draft.body.replace(/\n/g, '<br>')}
                                </div>
                            ` : '<p class="color-fg-muted">No description provided.</p>'}
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = draftHTML;
            
            // Add event listeners
            document.getElementById('edit-single-draft').addEventListener('click', () => {
                this.openDraftModal(draft);
            });
            
            document.getElementById('delete-single-draft').addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this draft?')) {
                    try {
                        await DraftManager.deleteDraft(draft.id);
                        window.location.hash = '#drafts';
                        this.showNotification('Draft deleted successfully!');
                    } catch (error) {
                        console.error('Error deleting draft:', error);
                        alert('Error deleting draft. Please try again.');
                    }
                }
            });
        },
        
        // Show draft not found
        showDraftNotFound(draftId) {
            const mainContent = document.querySelector('#js-repo-pjax-container, .container-xl');
            if (!mainContent) return;
            
            const notFoundHTML = `
                <div class="draft-not-found">
                    <nav class="breadcrumb">
                        <a href="#drafts">← Back to drafts</a>
                    </nav>
                    <div class="blankslate">
                        <h3 class="blankslate-heading">Draft not found</h3>
                        <p>The draft with ID "${draftId}" could not be found.</p>
                        <a href="#drafts" class="btn btn-primary">View all drafts</a>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = notFoundHTML;
        }
    };

    // Hash change handler for navigation
    function handleHashChange() {
        if (window.location.hash.startsWith('#drafts')) {
            UIManager.showDraftsView();
        }
    }

    // Initialize the extension
    function init() {
        // Only run on GitHub repository pages
        const pathParts = window.location.pathname.split('/').filter(part => part);
        if (pathParts.length < 2 || window.location.hostname !== 'github.com') {
            return;
        }
        
        // Add draft button to issues page
        if (window.location.pathname.includes('/issues') && !window.location.pathname.includes('/issues/new')) {
            UIManager.addDraftButton();
        }
        
        // Handle hash-based navigation
        window.addEventListener('hashchange', handleHashChange);
        
        // Handle initial hash if present
        if (window.location.hash.startsWith('#drafts')) {
            UIManager.showDraftsView();
        }
        
        // Re-run when page content changes (for GitHub's PJAX navigation)
        const observer = new MutationObserver((mutations) => {
            let shouldRerun = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    shouldRerun = true;
                }
            });
            
            if (shouldRerun && window.location.pathname.includes('/issues') && !window.location.pathname.includes('/issues/new')) {
                setTimeout(() => UIManager.addDraftButton(), 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'openDraftModal':
                UIManager.openDraftModal();
                sendResponse({ success: true });
                break;
            default:
                sendResponse({ error: 'Unknown action' });
        }
    });

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();