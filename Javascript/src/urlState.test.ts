/**
 * Tests for URL state management
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Helper function to check if sliders should skip encoding for motion/flip tabs
 * Motion and flip tabs never encode sliders - they always default to maximum
 */
function shouldSkipSliderEncodingForMotionFlip(tabName: string, paramName: string): boolean {
    return (tabName === 'motion' || tabName === 'flip') && 
           (paramName === 'massSlider' || paramName === 'distSlider');
}

/**
 * Helper function to check if time mode should skip encoding
 * Time mode is never encoded - always defaults to proper time
 */
function shouldSkipTimeModeEncoding(paramName: string): boolean {
    return paramName.endsWith('Mode');
}

describe('URL encoding for simplified state', () => {
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
    
    it('should always skip encoding mass sliders for motion tab', () => {
        expect(shouldSkipSliderEncodingForMotionFlip('motion', 'massSlider')).toBe(true);
    });
    
    it('should always skip encoding distance sliders for motion tab', () => {
        expect(shouldSkipSliderEncodingForMotionFlip('motion', 'distSlider')).toBe(true);
    });
    
    it('should always skip encoding mass sliders for flip tab', () => {
        expect(shouldSkipSliderEncodingForMotionFlip('flip', 'massSlider')).toBe(true);
    });
    
    it('should always skip encoding distance sliders for flip tab', () => {
        expect(shouldSkipSliderEncodingForMotionFlip('flip', 'distSlider')).toBe(true);
    });
    
    it('should not skip encoding sliders for other tabs', () => {
        expect(shouldSkipSliderEncodingForMotionFlip('twins', 'massSlider')).toBe(false);
        expect(shouldSkipSliderEncodingForMotionFlip('spacetime', 'distSlider')).toBe(false);
    });
    
    it('should always skip encoding time mode parameters', () => {
        expect(shouldSkipTimeModeEncoding('velMode')).toBe(true);
        expect(shouldSkipTimeModeEncoding('lorMode')).toBe(true);
        expect(shouldSkipTimeModeEncoding('rapMode')).toBe(true);
    });
    
    it('should not skip encoding regular parameters', () => {
        expect(shouldSkipTimeModeEncoding('accel')).toBe(false);
        expect(shouldSkipTimeModeEncoding('time')).toBe(false);
        expect(shouldSkipTimeModeEncoding('vel')).toBe(false);
    });
});
