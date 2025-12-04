import { describe, it, expect, beforeEach } from 'vitest';

describe('DOM environment', () => {
  beforeEach(() => {
    // Clear body using safe DOM methods
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('has document available', () => {
    expect(typeof document).toBe('object');
  });

  it('can create elements', () => {
    const div = document.createElement('div');
    div.textContent = 'test';
    expect(div.textContent).toBe('test');
  });

  it('can query elements', () => {
    const input = document.createElement('input');
    input.id = 'test-input';
    input.type = 'text';
    input.value = 'hello';
    document.body.appendChild(input);

    const found = document.getElementById('test-input') as HTMLInputElement;
    expect(found.value).toBe('hello');
  });
});
