import { ConsoleMessage, expect, test as base } from '@playwright/test';

const test = base.extend({
  page: async ({ page }, use) => {
    const consoleMessages: string[] = [];

    const handleConsole = (msg: ConsoleMessage) => {
      const type = msg.type();
      if (type === 'warning' || type === 'error') {
        consoleMessages.push(`[${type}] ${msg.text()}`);
      }
    };

    page.on('console', handleConsole);
    await use(page);
    page.off('console', handleConsole);

    if (consoleMessages.length > 0) {
      throw new Error(
        `Console warnings/errors detected:\n${consoleMessages.join('\n')}`,
      );
    }
  },
});

export { expect, test };
