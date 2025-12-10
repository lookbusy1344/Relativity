/**
 * Tests for URL state management
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Helper function to check if a mass slider should skip encoding
 * (matches the massSlider logic in urlState.ts updateURL() at lines 390-402)
 */
function shouldSkipMassSliderEncoding(slider: HTMLInputElement): boolean {
    const sliderValue = parseFloat(slider.value);
    // Check against the chart's actual max (stored in data-chart-max)
    // Fall back to slider.max if not yet initialized
    const chartMax = slider.dataset.chartMax ? parseFloat(slider.dataset.chartMax) : parseFloat(slider.max);
    const epsilon = 0.01; // Tolerance for floating-point comparison
    return !isNaN(chartMax) && !isNaN(sliderValue) && sliderValue >= chartMax - epsilon;
}

/**
 * Helper function to check if a distance slider should skip encoding
 * (matches the distSlider logic in urlState.ts updateURL() at lines 402-413)
 */
function shouldSkipDistanceSliderEncoding(slider: HTMLInputElement): boolean {
    const percentage = parseFloat(slider.value);
    const epsilon = 0.01; // Tolerance for floating-point comparison
    return !isNaN(percentage) && percentage >= 100 - epsilon;
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
        
        slider.value = '22.29'; // 0.01 below max (at epsilon boundary)
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

    it('should handle race condition by using data-chart-max', () => {
        const slider = document.getElementById('flipMassSlider') as HTMLInputElement;

        // Simulate the race condition scenario:
        // 1. HTML has max="4"
        // 2. Chart calculates actual max time = 3.4 years
        // 3. Slider value is set to 3.4 (the chart's max)
        // 4. slider.max might still be "4" (not yet updated)
        slider.max = '4';  // HTML default
        slider.value = '3.4';  // Chart's actual max time

        // WITHOUT data-chart-max set, this would fail (old behavior)
        expect(shouldSkipMassSliderEncoding(slider)).toBe(false);

        // WITH data-chart-max set (by initializeMassChartSlider), this works!
        slider.dataset.chartMax = '3.4';
        expect(shouldSkipMassSliderEncoding(slider)).toBe(true);  // FIXED!
    });
});
