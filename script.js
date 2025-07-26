document.addEventListener('DOMContentLoaded', () => {

    // --- DATA LOADING ---
    let promptData = {};

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

        let currentDataNode = promptData;

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

            Object.keys(choices).forEach(key => {
                const button = document.createElement('button');
                button.textContent = key;
                button.addEventListener('click', () => handleSelection(key, choices[key], levelIndex));
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
            promptOutput.value += selectedNode.prompt;

            const currentButtons = levelContainers[levelIndex].querySelectorAll('button');
            currentButtons.forEach(btn => {
                btn.disabled = true;
                if (btn.textContent !== key) {
                    btn.style.opacity = '0.5';
                } else {
                    btn.style.borderColor = '#6d28d9';
                    btn.style.borderWidth = '2px';
                }
            });

            if (levelIndex + 1 < levelContainers.length) {
                renderChoices(selectedNode.next, levelContainers[levelIndex + 1], levelIndex + 1);
            }
        }

        /**
         * Resets the entire interface to its initial state.
         */
        function reset() {
            promptOutput.value = '';
            levelContainers.forEach((container, index) => {
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
            const superPromptWrapper = `### SUPER-PROMPT INITIATED ###\nYou are a panel of world-class experts collaborating on this task. Your goal is to produce a response that is comprehensive, nuanced, and forward-thinking. Critically evaluate the user's prompt, identify any underlying assumptions, and provide a multi-faceted answer that anticipates follow-up questions.\n\nHere is the user's core request:\n---\n${currentPrompt}\n---\nPlease begin your expert-panel response.`;
            promptOutput.value = superPromptWrapper;
        });

        resetBtn.addEventListener('click', reset);

        // --- INITIALIZATION ---
        reset();
    }

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

    let currentDataNode = promptData;

    // --- FUNCTIONS ---

    /**
     * Renders choice buttons for a given level in the hierarchy.
     * @param {object} choices - The object containing the choices (e.g., promptData or a 'next' object).
     * @param {HTMLElement} container - The container element to append buttons to.
     * @param {number} levelIndex - The current hierarchy level (0-based).
     */
    function renderChoices(choices, container, levelIndex) {
        // Clear any previous buttons in this container
        container.innerHTML = '';
        if (!choices) return;

        Object.keys(choices).forEach(key => {
            const button = document.createElement('button');
            button.textContent = key;
            button.addEventListener('click', () => handleSelection(key, choices[key], levelIndex));
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
        // Append the selected prompt part to the textarea
        promptOutput.value += selectedNode.prompt;

        // Disable all buttons at the current level to prevent multiple selections
        const currentButtons = levelContainers[levelIndex].querySelectorAll('button');
        currentButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent !== key) {
                btn.style.opacity = '0.5'; // Visually fade out non-selected buttons
            } else {
                 btn.style.borderColor = '#6d28d9'; // Highlight selected
                 btn.style.borderWidth = '2px';
            }
        });

        // Render the next level of choices, if they exist
        if (levelIndex + 1 < levelContainers.length) {
            renderChoices(selectedNode.next, levelContainers[levelIndex + 1], levelIndex + 1);
        }
    }

    /**
     * Resets the entire interface to its initial state.
     */
    function reset() {
        promptOutput.value = '';
        levelContainers.forEach((container, index) => {
            container.innerHTML = '';
        });
        // Re-initialize the first level
        renderChoices(promptData, levelContainers[0], 0);
    }
    
    // --- EVENT LISTENERS ---

    // Copy Button
    copyBtn.addEventListener('click', () => {
        if (!promptOutput.value) return;
        navigator.clipboard.writeText(promptOutput.value).then(() => {
            copyBtn.textContent = 'COPIED! ✅';
            setTimeout(() => {
                copyBtn.textContent = 'COPY 📋';
            }, 2000);
        });
    });

    // Super-Prompt Button
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
    
    // Reset Button
    resetBtn.addEventListener('click', reset);

    // --- INITIALIZATION ---
    // Start the process by rendering the first level of choices.
    reset();
});