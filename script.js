document.addEventListener('DOMContentLoaded', () => {

    // --- DATA LOADING ---
    let promptData = {};
    let selectionPath = []; // Track user selections for navigation

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
         * Updates the prompt text and button styles based on current selection path
         */
        function updatePromptAndButtons() {
            // Rebuild prompt from scratch based on current path
            let fullPrompt = '';
            selectionPath.forEach(selection => {
                fullPrompt += selection.node.prompt;
            });
            promptOutput.value = fullPrompt;
            
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

        superPromptBtn.addEventListener('click', () => {
            if (!promptOutput.value) return;
            const currentPrompt = promptOutput.value;
            const superPromptWrapper = `### SUPER-PROMPT INITIATED ###
You are a panel of world-class experts collaborating on this task. Your goal is to produce a response that is comprehensive, nuanced, and forward-thinking. Critically evaluate the user's prompt, identify any underlying assumptions, and provide a multi-faceted answer that anticipates follow-up questions.

Here is the user's core request:
---
${currentPrompt}
---
Please begin your expert-panel response.`;
            
            promptOutput.value = superPromptWrapper;
        });
        
        resetBtn.addEventListener('click', reset);

        // --- INITIALIZATION ---
        reset();
    }
});