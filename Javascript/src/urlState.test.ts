/**
 * Tests for URL state management
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Helper function to check if a mass slider should skip encoding
 * (matches the massSlider logic in urlState.ts updateURL() at lines 390-398)
 */
function shouldSkipMassSliderEncoding(slider: HTMLInputElement): boolean {
    const sliderMax = parseFloat(slider.max);
    const sliderValue = parseFloat(slider.value);
    return !isNaN(sliderMax) && !isNaN(sliderValue) && sliderValue >= sliderMax;
}

/**
 * Helper function to check if a distance slider should skip encoding
 * (matches the distSlider logic in urlState.ts updateURL() at lines 401-406)
 */
function shouldSkipDistanceSliderEncoding(slider: HTMLInputElement): boolean {
    const percentage = parseFloat(slider.value);
    return !isNaN(percentage) && percentage >= 100;
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
});
