/**
 * URL State Management for Special Relativity Calculator
 * Handles bidirectional synchronization between URL parameters and calculator inputs
 */

// Parameter mapping: clean URL param name -> HTML input element ID
type ParamMap = Record<string, string>;

interface TabConfig {
    name: string;
    params: ParamMap;
    buttonId: string;
    tabId: string;  // Bootstrap tab button ID
}

// Tab configurations mapping URL params to input IDs
const TAB_CONFIGS: Record<string, TabConfig> = {
    motion: {
        name: 'motion',
        params: {
            accel: 'aAccelInput',
            time: 'aInput'
        },
        buttonId: 'aButton',
        tabId: 'motion-tab'
    },
    flip: {
        name: 'flip',
        params: {
            accel: 'flipAccelInput',
            dist: 'flipInput'
        },
        buttonId: 'flipButton',
        tabId: 'travel-tab'
    },
    spacetime: {
        name: 'spacetime',
        params: {
            time: 'spacetimeTime2',
            dist: 'spacetimeX2',
            vel: 'spacetimeVelocity'
        },
        buttonId: 'spacetimeButton',
        tabId: 'spacetime-tab'
    },
    calc: {
        name: 'calc',
        params: {
            // Handled separately - multiple calculators
            calc: 'calcType',  // Which calculator to use
            vel: 'lorentzInput',  // Generic param names
            vel1: 'v1Input',
            vel2: 'v2Input',
            rapidity: 'rapidityInput',
            fuel: 'pionFuelMassInput',
            dry: 'pionDryMassInput',
            eff: 'pionEfficiencyInput',
            thrustTime: 'fuelFractionTimeInput',
            thrustEff: 'fuelFractionEffInput'
        },
        buttonId: '',  // Determined by calc type
        tabId: 'conversions-tab'
    }
};

// Calc sub-calculator mappings
const CALC_CONFIGS: Record<string, { params: string[], buttonId: string }> = {
    lorentz: { params: ['vel'], buttonId: 'lorentzButton' },
    rapidity: { params: ['rapidity'], buttonId: 'rapidityButton' },
    velocity: { params: ['vel'], buttonId: 'velocityButton' },
    addvel: { params: ['vel1', 'vel2'], buttonId: 'addButton' },
    pion: { params: ['fuel', 'dry', 'eff'], buttonId: 'pionAccelButton' },
    fuelfrac: { params: ['thrustTime', 'thrustEff'], buttonId: 'fuelFractionButton' }
};

/**
 * Get the default value for an input element from its HTML value attribute
 */
function getDefaultValue(inputId: string): string {
    const input = document.getElementById(inputId) as HTMLInputElement;
    return input?.defaultValue || input?.value || '';
}

/**
 * Validate a numeric input value
 */
function isValidNumber(value: string): boolean {
    if (!value || value.trim() === '') return false;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
}

/**
 * Get the currently active tab name
 */
function getActiveTab(): string {
    const activeTab = document.querySelector('.nav-link.active');
    if (!activeTab) return 'motion';

    const tabId = activeTab.getAttribute('id');
    if (tabId === 'motion-tab') return 'motion';
    if (tabId === 'travel-tab') return 'flip';
    if (tabId === 'spacetime-tab') return 'spacetime';
    if (tabId === 'conversions-tab') return 'calc';

    return 'motion';
}

/**
 * Initialize page state from URL parameters on page load
 */
export function initializeFromURL(): void {
    const urlParams = new URLSearchParams(window.location.search);

    // Get tab parameter
    const tabParam = urlParams.get('tab')?.toLowerCase();
    if (!tabParam || !TAB_CONFIGS[tabParam]) {
        // No valid tab in URL, use default behavior
        return;
    }

    const tabConfig = TAB_CONFIGS[tabParam];

    // Activate the specified tab
    const tabButton = document.getElementById(tabConfig.tabId);
    if (tabButton) {
        const tab = new (window as any).bootstrap.Tab(tabButton);
        tab.show();
    }

    // Handle calc tab separately due to multiple calculators
    if (tabParam === 'calc') {
        initializeCalcFromURL(urlParams);
        return;
    }

    // Populate input fields from URL params
    let hasValidParams = false;
    for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
        const paramValue = urlParams.get(paramName);
        if (paramValue && isValidNumber(paramValue)) {
            const input = document.getElementById(inputId) as HTMLInputElement;
            if (input) {
                input.value = paramValue;
                hasValidParams = true;
            }
        }
    }

    // Trigger calculation if we had valid parameters
    if (hasValidParams) {
        // Wait for tab transition and rendering to complete
        setTimeout(() => {
            const calcButton = document.getElementById(tabConfig.buttonId);
            if (calcButton) {
                calcButton.click();
            }
        }, 300);
    }
}

/**
 * Initialize calc tab from URL parameters
 */
function initializeCalcFromURL(urlParams: URLSearchParams): void {
    const tabConfig = TAB_CONFIGS.calc;

    // Try to infer which calculator based on params present
    let calcType = urlParams.get('calc')?.toLowerCase();

    if (!calcType) {
        // Infer calculator from parameters
        if (urlParams.has('vel1') && urlParams.has('vel2')) {
            calcType = 'addvel';
        } else if (urlParams.has('rapidity')) {
            calcType = 'rapidity';
        } else if (urlParams.has('fuel') || urlParams.has('dry')) {
            calcType = 'pion';
        } else if (urlParams.has('thrustTime')) {
            calcType = 'fuelfrac';
        } else if (urlParams.has('vel')) {
            // Default to lorentz for single velocity parameter
            calcType = 'lorentz';
        }
    }

    if (!calcType || !CALC_CONFIGS[calcType]) return;

    const calcConfig = CALC_CONFIGS[calcType];

    // Populate inputs for this calculator
    let hasValidParams = false;
    for (const paramName of calcConfig.params) {
        const paramValue = urlParams.get(paramName);
        const inputId = tabConfig.params[paramName];

        if (paramValue && inputId && isValidNumber(paramValue)) {
            const input = document.getElementById(inputId) as HTMLInputElement;
            if (input) {
                input.value = paramValue;
                hasValidParams = true;
            }
        }
    }

    // Trigger calculation
    if (hasValidParams) {
        setTimeout(() => {
            const calcButton = document.getElementById(calcConfig.buttonId);
            if (calcButton) {
                calcButton.click();
            }
        }, 300);
    }
}

/**
 * Update URL to reflect current application state
 */
export function updateURL(): void {
    const activeTab = getActiveTab();
    const tabConfig = TAB_CONFIGS[activeTab];
    if (!tabConfig) return;

    const params = new URLSearchParams();
    params.set('tab', activeTab);

    // Handle calc tab separately
    if (activeTab === 'calc') {
        updateCalcURL(params);
    } else {
        // Add non-default parameters
        for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
            const input = document.getElementById(inputId) as HTMLInputElement;
            if (!input) continue;

            const currentValue = input.value;
            const defaultValue = getDefaultValue(inputId);

            // Only include if different from default and valid
            if (currentValue !== defaultValue && isValidNumber(currentValue)) {
                params.set(paramName, currentValue);
            }
        }
    }

    // Update URL without page reload
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
}

/**
 * Update URL for calc tab (needs to track which calculator is active)
 */
function updateCalcURL(params: URLSearchParams): void {
    // This is simplified - in full implementation, track which calc section was last used
    // For now, just include all non-default calc params
    const tabConfig = TAB_CONFIGS.calc;

    for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
        if (paramName === 'calc') continue;  // Skip calc type for now

        const input = document.getElementById(inputId) as HTMLInputElement;
        if (!input) continue;

        const currentValue = input.value;
        const defaultValue = getDefaultValue(inputId);

        if (currentValue !== defaultValue && isValidNumber(currentValue)) {
            params.set(paramName, currentValue);
        }
    }
}

/**
 * Set up bidirectional URL synchronization
 */
export function setupURLSync(): void {
    let debounceTimer: number | undefined;

    // Update URL when inputs change (debounced for text inputs)
    const allInputs = document.querySelectorAll('input[type="number"]');
    allInputs.forEach(input => {
        // Debounced update on input (while typing)
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => {
                updateURL();
            }, 500);
        });

        // Immediate update on change (blur, enter key)
        input.addEventListener('change', () => {
            clearTimeout(debounceTimer);
            updateURL();
        });
    });

    // Update URL when tab changes
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', () => {
            updateURL();
        });
    });

    // Update URL when calculate buttons are clicked
    const calcButtons = document.querySelectorAll('.btn-calculate');
    calcButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Small delay to ensure inputs are settled
            setTimeout(() => {
                updateURL();
            }, 50);
        });
    });
}
