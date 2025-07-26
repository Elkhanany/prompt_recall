document.addEventListener('DOMContentLoaded', () => {

    // --- DATA LOADING ---
    let promptData = {};
    let selectionPath = []; // Track user selections for navigation
    let promptHistory = JSON.parse(localStorage.getItem('promptHistory') || '[]');
    let favoritePrompts = JSON.parse(localStorage.getItem('favoritePrompts') || '[]');

    fetch('prompts.json')
        .then(response => response.json())
        .then(data => {
            promptData = data;
            initializeApp();
        })
        .catch(error => {
            console.error('Error loading prompts.json:', error);
            // Optionally, show an error message in the UI
        });

    function initializeApp() {
        // --- DOM ELEMENTS ---
        const levelContainers = [
            document.getElementById('level-1'),
            document.getElementById('level-2'),
            document.getElementById('level-3')
        ];
        const promptOutput = document.getElementById('prompt-output');
        const copyBtn = document.getElementById('copy-btn');
        const superPromptBtn = document.getElementById('super-prompt-btn');
        const resetBtn = document.getElementById('reset-btn');
        const historyBtn = document.getElementById('history-btn');
        const favoriteBtn = document.getElementById('favorite-btn');
        const exportBtn = document.getElementById('export-btn');

        // --- FUNCTIONS ---

        /**
         * Renders choice buttons for a given level in the hierarchy.
         * @param {object} choices - The object containing the choices (e.g., promptData or a 'next' object).
         * @param {HTMLElement} container - The container element to append buttons to.
         * @param {number} levelIndex - The current hierarchy level (0-based).
         */
        function renderChoices(choices, container, levelIndex) {
            container.innerHTML = '';
            if (!choices) return;

            // Apply fade-in animation
            container.style.opacity = 0;
            setTimeout(() => {
                container.style.opacity = 1;
            }, 50);

            Object.keys(choices).forEach(key => {
                const button = document.createElement('button');
                button.textContent = key;
                button.addEventListener('click', () => handleSelection(key, choices[key], levelIndex));
                
                // If this item is already in our selection path at this level, mark it as selected
                if (selectionPath.length > levelIndex && selectionPath[levelIndex].key === key) {
                    button.classList.add('selected');
                }
                
                container.appendChild(button);
            });
        }

        /**
         * Handles the logic when a user clicks a selection button.
         * @param {string} key - The text of the button clicked.
         * @param {object} selectedNode - The data node corresponding to the clicked button.
         * @param {number} levelIndex - The hierarchy level of the clicked button.
         */
        function handleSelection(key, selectedNode, levelIndex) {
            // Check if clicking on an already selected button at this level
            const isAlreadySelected = selectionPath.length > levelIndex && selectionPath[levelIndex].key === key;
            
            if (isAlreadySelected) {
                // Clicking on selected button "reopens" this level - clear this level and beyond
                selectionPath = selectionPath.slice(0, levelIndex);
                
                // Clear out all buttons in the next levels
                for (let i = levelIndex + 1; i < levelContainers.length; i++) {
                    levelContainers[i].innerHTML = '';
                }
                
                // Re-render this level to show all options
                const choicesForThisLevel = getChoicesForLevel(levelIndex);
                renderChoices(choicesForThisLevel, levelContainers[levelIndex], levelIndex);
                
                updatePromptAndButtons();
                return;
            }
            
            // If clicking a button at a level that's already been chosen, truncate the path
            if (levelIndex < selectionPath.length) {
                // Remove selections from this level onwards
                selectionPath = selectionPath.slice(0, levelIndex);
                
                // Clear out all buttons in the next levels
                for (let i = levelIndex + 1; i < levelContainers.length; i++) {
                    levelContainers[i].innerHTML = '';
                }
            }

            // Add the new selection to the path
            selectionPath.push({ key, node: selectedNode });
            
            // Update the UI
            updatePromptAndButtons();
            
            // Render the next level if available
            if (levelIndex + 1 < levelContainers.length && selectedNode.next) {
                renderChoices(selectedNode.next, levelContainers[levelIndex + 1], levelIndex + 1);
            }
        }
        
        /**
         * Gets the choices object for a specific level based on the current selection path
         * @param {number} levelIndex - The level to get choices for
         * @returns {object} The choices object for that level
         */
        function getChoicesForLevel(levelIndex) {
            if (levelIndex === 0) {
                return promptData;
            }
            
            let current = promptData;
            for (let i = 0; i < levelIndex; i++) {
                if (selectionPath[i] && current[selectionPath[i].key] && current[selectionPath[i].key].next) {
                    current = current[selectionPath[i].key].next;
                } else {
                    return null;
                }
            }
            return current;
        }
        
        /**
         * Updates the prompt text and button styles based on current selection path
         */
        function updatePromptAndButtons() {
            // Rebuild prompt from scratch based on current path
            let fullPrompt = '';
            selectionPath.forEach(selection => {
                fullPrompt += selection.node.prompt;
            });
            promptOutput.value = fullPrompt;
            
            // Save to history if it's a complete prompt
            if (fullPrompt.trim() && selectionPath.length > 0) {
                saveToHistory(fullPrompt, selectionPath);
            }
            
            // Update button styles and container classes in all levels
            levelContainers.forEach((container, levelIdx) => {
                const buttons = container.querySelectorAll('button');
                
                // Add or remove a class to the container if a selection has been made
                if (selectionPath.length > levelIdx) {
                    container.classList.add('level-has-selection');
                } else {
                    container.classList.remove('level-has-selection');
                }
                
                // Reset all buttons to default state
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.classList.remove('selected');
                });
                
                // Mark selected button if we have one at this level
                if (selectionPath.length > levelIdx) {
                    const selectedKey = selectionPath[levelIdx].key;
                    buttons.forEach(btn => {
                        if (btn.textContent === selectedKey) {
                            btn.classList.add('selected');
                        }
                    });
                }
            });
        }

        function saveToHistory(prompt, path) {
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                prompt: prompt,
                path: path.map(p => p.key),
                preview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
            };
            
            // Remove duplicate if exists
            promptHistory = promptHistory.filter(item => item.prompt !== prompt);
            
            // Add to beginning
            promptHistory.unshift(historyItem);
            
            // Keep only last 50 items
            if (promptHistory.length > 50) {
                promptHistory = promptHistory.slice(0, 50);
            }
            
            localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
        }

        function toggleFavorite() {
            if (!promptOutput.value.trim()) return;
            
            const currentPrompt = promptOutput.value;
            const existingIndex = favoritePrompts.findIndex(fav => fav.prompt === currentPrompt);
            
            if (existingIndex >= 0) {
                // Remove from favorites
                favoritePrompts.splice(existingIndex, 1);
                favoriteBtn.textContent = '☆ FAVORITE';
                favoriteBtn.style.background = 'linear-gradient(90deg, #bfc6ce 0%, #e0e5ea 100%)';
            } else {
                // Add to favorites
                const favoriteItem = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    prompt: currentPrompt,
                    path: selectionPath.map(p => p.key),
                    name: `${selectionPath.map(p => p.key.replace(/^(Field|Action|Type): /, '')).join(' → ')}`,
                    preview: currentPrompt.substring(0, 100) + (currentPrompt.length > 100 ? '...' : '')
                };
                favoritePrompts.unshift(favoriteItem);
                favoriteBtn.textContent = '★ FAVORITED';
                favoriteBtn.style.background = 'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)';
            }
            
            localStorage.setItem('favoritePrompts', JSON.stringify(favoritePrompts));
        }

        function updateFavoriteButton() {
            if (!promptOutput.value.trim()) {
                favoriteBtn.textContent = '☆ FAVORITE';
                favoriteBtn.style.background = 'linear-gradient(90deg, #bfc6ce 0%, #e0e5ea 100%)';
                return;
            }
            
            const isFavorited = favoritePrompts.some(fav => fav.prompt === promptOutput.value);
            if (isFavorited) {
                favoriteBtn.textContent = '★ FAVORITED';
                favoriteBtn.style.background = 'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)';
            } else {
                favoriteBtn.textContent = '☆ FAVORITE';
                favoriteBtn.style.background = 'linear-gradient(90deg, #bfc6ce 0%, #e0e5ea 100%)';
            }
        }

        function showHistoryModal() {
            const modal = createModal('Prompt History', promptHistory.map(item => ({
                ...item,
                title: item.path.join(' → ').replace(/Field: |Action: |Type: /g, '')
            })), 'Load Prompt', loadHistoryItem);
        }

        function showFavoritesModal() {
            const modal = createModal('Favorite Prompts', favoritePrompts, 'Load Favorite', loadFavoriteItem);
        }

        function createModal(title, items, actionText, actionCallback) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${items.length === 0 ? `<p class="empty-state">No ${title.toLowerCase()} yet. Start creating prompts!</p>` : 
                        items.map(item => `
                            <div class="history-item" data-id="${item.id}">
                                <div class="history-item-header">
                                    <span class="history-title">${item.title || item.name || 'Untitled'}</span>
                                    <span class="history-date">${new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div class="history-preview">${item.preview}</div>
                                <div class="history-actions">
                                    <button class="history-load">${actionText}</button>
                                    <button class="history-delete">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
            modal.querySelectorAll('.history-load').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemId = parseInt(e.target.closest('.history-item').dataset.id);
                    actionCallback(itemId);
                    modal.remove();
                });
            });
            
            modal.querySelectorAll('.history-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemId = parseInt(e.target.closest('.history-item').dataset.id);
                    deleteHistoryItem(itemId, title.includes('History'));
                    e.target.closest('.history-item').remove();
                });
            });
            
            return modal;
        }

        function loadHistoryItem(itemId) {
            const item = promptHistory.find(h => h.id === itemId);
            if (item) {
                promptOutput.value = item.prompt;
                updateFavoriteButton();
            }
        }

        function loadFavoriteItem(itemId) {
            const item = favoritePrompts.find(f => f.id === itemId);
            if (item) {
                promptOutput.value = item.prompt;
                updateFavoriteButton();
            }
        }

        function deleteHistoryItem(itemId, isHistory) {
            if (isHistory) {
                promptHistory = promptHistory.filter(item => item.id !== itemId);
                localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
            } else {
                favoritePrompts = favoritePrompts.filter(item => item.id !== itemId);
                localStorage.setItem('favoritePrompts', JSON.stringify(favoritePrompts));
                updateFavoriteButton();
            }
        }

        function exportPrompts() {
            const exportData = {
                timestamp: new Date().toISOString(),
                history: promptHistory,
                favorites: favoritePrompts,
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompt-builder-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        /**
         * Resets the entire interface to its initial state.
         */
        function reset() {
            promptOutput.value = '';
            selectionPath = [];
            levelContainers.forEach((container) => {
                container.innerHTML = '';
            });
            renderChoices(promptData, levelContainers[0], 0);
        }

        // --- EVENT LISTENERS ---

        copyBtn.addEventListener('click', () => {
            if (!promptOutput.value) return;
            navigator.clipboard.writeText(promptOutput.value).then(() => {
                copyBtn.textContent = 'COPIED! ✅';
                setTimeout(() => {
                    copyBtn.textContent = 'COPY 📋';
                }, 2000);
            });
        });

        // Watch for changes in the textarea to update favorite button
        promptOutput.addEventListener('input', updateFavoriteButton);

        favoriteBtn.addEventListener('click', toggleFavorite);
        historyBtn.addEventListener('click', showHistoryModal);
        exportBtn.addEventListener('click', exportPrompts);

        superPromptBtn.addEventListener('click', () => {
            if (!promptOutput.value) return;
            const currentPrompt = promptOutput.value;
            
            // Extract the field from the selection path for context
            let fieldContext = "";
            let taskContext = "";
            if (selectionPath.length > 0) {
                const field = selectionPath[0].key.replace("Field: ", "");
                fieldContext = field;
                if (selectionPath.length > 1) {
                    taskContext = selectionPath[1].key.replace("Action: ", "");
                }
            }
            
            const superPromptWrapper = `### EXPERT PANEL CONSULTATION INITIATED ###

You are convening a distinguished panel of world-class experts specifically assembled for this ${fieldContext.toLowerCase()} task. This panel operates at the highest level of professional expertise, combining deep domain knowledge with practical wisdom gained from years of real-world application.

**PANEL COMPOSITION:**
${fieldContext === "Medical" ? "- Board-certified physicians with subspecialty expertise\n- Clinical researchers with publication track records\n- Healthcare administrators with quality improvement experience\n- Patient advocates with lived experience perspectives" : ""}${fieldContext === "Business" ? "- C-suite executives with scale-up experience\n- Management consultants from top-tier firms\n- Industry veterans with market disruption experience\n- Investment professionals with portfolio expertise" : ""}${fieldContext === "Code" ? "- Senior software architects with system design expertise\n- DevOps engineers with scale and reliability experience\n- Security experts with threat modeling backgrounds\n- Product engineers with user experience focus" : ""}${fieldContext === "Research" ? "- Principal investigators with grant funding success\n- Methodological experts in quantitative and qualitative approaches\n- Peer reviewers with editorial board experience\n- Translational researchers bridging theory and application" : ""}${fieldContext === "Education" ? "- Educational psychologists with learning theory expertise\n- Curriculum designers with standards alignment experience\n- Classroom practitioners with diverse student populations\n- Assessment specialists with measurement expertise" : ""}${fieldContext === "Creative" ? "- Published authors with critical acclaim\n- Literary agents with market insight\n- Creative writing instructors with pedagogical experience\n- Editors with genre-specific expertise" : ""}${fieldContext === "" ? "- Domain experts with deep specialty knowledge\n- Practitioners with hands-on implementation experience\n- Researchers with methodological rigor\n- Strategic thinkers with systems perspective" : ""}

**CONSULTATION FRAMEWORK:**
1. **Initial Assessment:** Examine the request for underlying assumptions, scope, and complexity
2. **Multi-perspective Analysis:** Each expert contributes domain-specific insights and identifies potential blind spots
3. **Synthesis Integration:** Combine perspectives into a coherent, actionable response
4. **Quality Assurance:** Cross-validate recommendations and identify implementation considerations
5. **Future-proofing:** Anticipate follow-up questions and downstream implications

**EXPERT STANDARDS:**
- Ground all recommendations in evidence-based practices and current best standards
- Acknowledge limitations and areas requiring additional expertise or information
- Provide specific, actionable guidance rather than theoretical concepts
- Consider ethical implications and potential unintended consequences
- Maintain awareness of resource constraints and practical implementation challenges

**ORIGINAL REQUEST:**
---
${currentPrompt}
---

**PANEL DIRECTIVE:** 
Proceed with your expert consultation, ensuring each perspective contributes meaningfully to a comprehensive, nuanced, and immediately actionable response. Begin your collaborative analysis.`;
            
            promptOutput.value = superPromptWrapper;
        });
        
        resetBtn.addEventListener('click', reset);

        // --- INITIALIZATION ---
        reset();
    }
});