import AxeBuilder from '@axe-core/playwright';
import axeCore from 'axe-core';

const WCAG_TAG_PATTERN = /^wcag(?:2|21|22)(?:a|aa)$/;

/**
 * Axe 4.13.0 publishes versioned WCAG tags independently. Build the scan
 * configuration from the installed rule metadata so the gate cannot silently
 * regress to the original WCAG 2.0-only pair or depend on guessed tags.
 */
export const AXE_WCAG_TAG_INVENTORY = Object.freeze(
  axeCore.getRules().reduce((inventory, rule) => {
    rule.tags.filter(tag => WCAG_TAG_PATTERN.test(tag)).forEach(tag => {
      inventory[tag] = (inventory[tag] || 0) + 1;
    });
    return inventory;
  }, {})
);

export const AXE_WCAG_TAGS = Object.freeze(Object.keys(AXE_WCAG_TAG_INVENTORY).sort());
export const AXE_EXCLUDED_RULES = Object.freeze([]);

/**
 * Run the WCAG A/AA rules that apply to the student prototype.  This helper is
 * deliberately test-only; Axe is never loaded by the application runtime.
 */
export function runAxe(page) {
  return new AxeBuilder({ page })
    .withTags(AXE_WCAG_TAGS)
    .analyze();
}

function describeTarget(target) {
  const name = target.name || '(unnamed)';
  return `${target.selector} (${name}) measured ${target.width.toFixed(2)}×${target.height.toFixed(2)}px`;
}

/**
 * Measure practical hit regions for visible native actions. Radio/checkbox
 * inputs are measured as their associated label so the complete option card is
 * treated as the hit area rather than the 18px form control alone.
 */
export async function measureActionableTargets(page) {
  return page.evaluate(() => {
    const selectors = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'summary',
      '[role="button"]',
      '[role="tab"]',
      '[role="option"]',
      '[role="link"]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const elements = [...document.querySelectorAll(selectors)];
    const seen = new Set();
    const hidden = element => {
      if (!element || seen.has(element)) return true;
      if (element.closest('[hidden], [aria-hidden="true"]')) return true;
      const style = getComputedStyle(element);
      return style.display === 'none' || style.visibility === 'hidden' || !element.getClientRects().length;
    };
    const disabled = element => element.disabled || element.getAttribute('aria-disabled') === 'true';
    const accessibleName = element => {
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const text = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.innerText || '').join(' ').trim();
        if (text) return text;
      }
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel?.trim()) return ariaLabel.trim();
      if (element.labels?.length) {
        const text = [...element.labels].map(label => label.innerText || '').join(' ').trim();
        if (text) return text;
      }
      const title = element.getAttribute('title');
      if (title?.trim()) return title.trim();
      return (element.innerText || element.value || '').replace(/\s+/g, ' ').trim();
    };
    const selectorFor = element => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const testId = element.getAttribute('data-testid');
      if (testId) return `[data-testid="${CSS.escape(testId)}"]`;
      return element.tagName.toLowerCase();
    };

    const targets = [];
    elements.forEach(element => {
      if (element.matches('.skip-link')) return;
      if (hidden(element) || disabled(element)) return;
      const sourceElement = element;
      let targetElement = element;
      if (element.matches('input[type="radio"], input[type="checkbox"]')) {
        const label = element.closest('label');
        if (label && !hidden(label) && !disabled(label)) targetElement = label;
      } else if (element.matches('input[type="search"], input[type="text"]') && element.closest('.search')) {
        targetElement = element.closest('.search');
      }
      if (hidden(targetElement) || disabled(targetElement) || seen.has(targetElement)) return;
      seen.add(targetElement);
      const rect = targetElement.getBoundingClientRect();
      const touchInset = Number.parseFloat(getComputedStyle(targetElement).getPropertyValue('--touch-target-inset')) || 0;
      targets.push({
        selector: selectorFor(targetElement),
        name: accessibleName(sourceElement),
        width: rect.width + touchInset * 2,
        height: rect.height + touchInset * 2,
        rawWidth: rect.width,
        rawHeight: rect.height,
        touchInset,
        isInlineLink: sourceElement.matches('a[href]') && !sourceElement.matches('.btn, .list-row, .notification-link, .voice-issue-card, .priority-link, .hero-link, .home-action, .home-icon-link')
      });
    });
    return targets;
  });
}

export async function assertMinimumTarget(page, route, minimum = 44) {
  const targets = await measureActionableTargets(page);
  // CSS specifies the minimum exactly; Chromium/Windows can expose a tiny
  // floating-point bounding-box error, so this epsilon is measurement
  // precision only and does not make a real 43px target pass.
  const epsilon = 0.01;
  const failures = targets.filter(target => !target.name || target.width + epsilon < minimum || target.height + epsilon < minimum);
  if (failures.length) {
    throw new Error(`Target audit failed for ${route}:\n${failures.map(describeTarget).join('\n')}`);
  }
  return targets.length;
}

export async function assertNoHorizontalOverflow(page, route) {
  const result = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
    const overflowing = [...document.querySelectorAll('body *')].filter(element => {
      if (element.closest('.filters')) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.right > viewport + 1;
    }).slice(0, 8).map(element => ({
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      right: element.getBoundingClientRect().right
    }));
    return { viewport, documentWidth, overflowing };
  });
  if (result.documentWidth > result.viewport + 1 || result.overflowing.length) {
    throw new Error(`Horizontal overflow at ${route}: viewport ${result.viewport}px, document ${result.documentWidth}px, elements ${JSON.stringify(result.overflowing)}`);
  }
  return result;
}

export async function assertVisibleFocusIndicator(page, selector) {
  const locator = page.locator(selector).first();
  // Establish keyboard modality before focusing programmatically; Chromium
  // otherwise may intentionally omit :focus-visible for a button.
  await page.keyboard.press('Tab');
  await locator.focus();
  const style = await locator.evaluate(element => {
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow
    };
  });
  const outlineVisible = style.outlineStyle !== 'none' && style.outlineWidth !== '0px' && style.outlineColor !== 'rgba(0, 0, 0, 0)';
  const shadowVisible = style.boxShadow !== 'none' && !style.boxShadow.includes('rgba(0, 0, 0, 0)');
  if (!outlineVisible && !shadowVisible) {
    throw new Error(`No visible focus indicator for ${selector}: ${JSON.stringify(style)}`);
  }
}
