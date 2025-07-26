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