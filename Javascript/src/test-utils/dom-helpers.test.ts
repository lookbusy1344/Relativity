import { describe, it, expect, beforeEach } from 'vitest';
import { createMockCalculatorDOM, setInputValue, getResultText, clearBody } from './dom-helpers';

describe('DOM test helpers', () => {
  beforeEach(() => {
    clearBody();
  });

  describe('createMockCalculatorDOM', () => {
    it('creates input elements', () => {
      createMockCalculatorDOM(['velocity', 'distance']);

      expect(document.getElementById('velocity')).toBeInstanceOf(HTMLInputElement);
      expect(document.getElementById('distance')).toBeInstanceOf(HTMLInputElement);
    });

    it('creates result spans', () => {
      createMockCalculatorDOM(['velocity'], ['gamma-result']);

      expect(document.getElementById('gamma-result')).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('setInputValue', () => {
    it('sets input value', () => {
      createMockCalculatorDOM(['test-input']);
      setInputValue('test-input', '123');

      const input = document.getElementById('test-input') as HTMLInputElement;
      expect(input.value).toBe('123');
    });
  });

  describe('getResultText', () => {
    it('gets result span text', () => {
      createMockCalculatorDOM([], ['result']);
      const span = document.getElementById('result') as HTMLSpanElement;
      span.textContent = 'calculated value';

      expect(getResultText('result')).toBe('calculated value');
    });
  });
});
