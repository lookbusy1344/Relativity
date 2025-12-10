/**
 * Tests for URL state management
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Helper function to check if a mass slider should skip encoding
 * (matches the massSlider logic in urlState.ts updateURL() at lines 390-406)
 */
function shouldSkipMassSliderEncoding(slider: HTMLInputElement): boolean {
    const sliderValue = parseFloat(slider.value);
    const sliderMax = parseFloat(slider.max);
    const epsilon = 0.01;

    // Skip if slider is at its current maximum
    return !isNaN(sliderMax) && Math.abs(sliderValue - sliderMax) <= epsilon;
}

/**
 * Helper function to check if a distance slider should skip encoding
 * (matches the distSlider logic in urlState.ts updateURL() at lines 402-420)
 */
function shouldSkipDistanceSliderEncoding(slider: HTMLInputElement): boolean {
    const percentage = parseFloat(slider.value);
    const sliderMax = parseFloat(slider.max);
    const epsilon = 0.01; // Tolerance for floating-point comparison
    const isAtPercentageMax = !isNaN(percentage) && percentage >= 100 - epsilon;
    const isAtUninitializedMax = !isNaN(sliderMax) && Math.abs(percentage - sliderMax) <= epsilon;
    return isAtPercentageMax || isAtUninitializedMax;
}

describe('URL encoding for slider defaults', () => {
    beforeEach(() => {
        // Set up DOM elements
        document.body.innerHTML = `
            <!-- Motion tab sliders -->
            <input type="range" id="accelMassSlider" min="50" max="365" value="365" />
            <input type="range" id="accelPositionSlider" min="0" max="100" value="100" data-max-distance="10" />
            
            <!-- Flip tab sliders -->
            <input type="range" id="flipMassSlider" min="0.5" max="4" value="4" />
            <input type="range" id="flipPositionSlider" min="0" max="100" value="100" data-max-distance="10" />
            
            <!-- Active tab (motion) -->
            <div class="nav-link active" id="motion-tab"></div>
        `;
    });
    
    it('should skip encoding mass slider when at max value', () => {
        const slider = document.getElementById('accelMassSlider') as HTMLInputElement;
        
        // Test at max (should not encode)
        slider.value = '365';
        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);
        
        // Test below max (should encode)
        slider.value = '300';
        expect(shouldSkipMassSliderEncoding(slider)).toBe(false);
    });
    
    it('should skip encoding mass slider when at dynamically set max', () => {
        const slider = document.getElementById('flipMassSlider') as HTMLInputElement;

        // Simulate dynamic max update (like after calculation)
        slider.max = '22.3';
        slider.value = '22.3';

        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);
    });
    
    it('should skip encoding distance slider when at 100%', () => {
        const slider = document.getElementById('accelPositionSlider') as HTMLInputElement;
        
        // Test at 100% (should not encode)
        slider.value = '100';
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(true);
        
        // Test below 100% (should encode)
        slider.value = '75';
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(false);
    });
    
    it('should encode mass slider when below max', () => {
        const slider = document.getElementById('accelMassSlider') as HTMLInputElement;
        slider.value = '200';
        
        expect(shouldSkipMassSliderEncoding(slider)).toBe(false);
    });
    
    it('should encode distance slider when below 100%', () => {
        const slider = document.getElementById('flipPositionSlider') as HTMLInputElement;
        slider.value = '50';
        
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(false);
    });
    
    it('should handle edge case of slider value equal to max', () => {
        const slider = document.getElementById('flipMassSlider') as HTMLInputElement;
        slider.max = '10.5';
        slider.value = '10.5';

        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);
    });
    
    it('should handle edge case of distance slider at exactly 100', () => {
        const slider = document.getElementById('accelPositionSlider') as HTMLInputElement;
        slider.value = '100.0';
        
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(true);
    });
    
    it('should handle floating-point precision near max for mass slider', () => {
        const slider = document.getElementById('flipMassSlider') as HTMLInputElement;

        // Test values very close to max (within epsilon tolerance)
        slider.max = '22.3';
        slider.value = '22.299'; // 0.001 below max (within 0.01 epsilon)
        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);

        slider.value = '22.295'; // 0.005 below max (well within epsilon)
        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);

        // Test value just outside tolerance
        slider.value = '22.28'; // 0.02 below max (outside epsilon)
        expect(shouldSkipMassSliderEncoding(slider)).toBe(false);
    });
    
    it('should handle floating-point precision near 100% for distance slider', () => {
        const slider = document.getElementById('accelPositionSlider') as HTMLInputElement;

        // Test values very close to 100% (within epsilon tolerance)
        slider.value = '99.999'; // 0.001 below 100 (within 0.01 epsilon)
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(true);

        slider.value = '99.99'; // 0.01 below 100 (at epsilon boundary)
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(true);

        // Test value just outside tolerance
        slider.value = '99.98'; // 0.02 below 100 (outside epsilon)
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(false);
    });

    it('should skip encoding when slider is at rounded-up max', () => {
        const slider = document.getElementById('flipMassSlider') as HTMLInputElement;

        // Simulate the scenario after initializeMassChartSlider runs:
        // 1. Chart data max is 3.4 years (discrete data points)
        // 2. initializeMassChartSlider rounds up: Math.ceil(3.4 * 2) / 2 = 3.5
        // 3. Slider max and value are both set to 3.5
        slider.max = '3.5';  // Rounded up from chart data max 3.4
        slider.value = '3.5';  // Set to rounded max

        // Slider is at its maximum, so skip encoding
        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);
    });

    it('should skip encoding uninitialized distance slider at HTML default', () => {
        const slider = document.getElementById('flipPositionSlider') as HTMLInputElement;

        // Simulate tab switch BEFORE initialization:
        // HTML has: <input type="range" id="flipPositionSlider" min="0" max="10" value="10">
        // initializePositionVelocitySlider hasn't run yet (it runs on Calculate button click)
        slider.max = '10';  // HTML default
        slider.value = '10';  // HTML default (at max)

        // Slider is at its uninitialized max, so skip encoding
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(true);
    });

    it('should encode uninitialized distance slider when moved from HTML default', () => {
        const slider = document.getElementById('flipPositionSlider') as HTMLInputElement;

        // Simulate user moving slider before Calculate is pressed
        slider.max = '10';  // HTML default
        slider.value = '5';  // User moved slider to middle

        // Slider is not at max, so should encode
        expect(shouldSkipDistanceSliderEncoding(slider)).toBe(false);
    });
});
