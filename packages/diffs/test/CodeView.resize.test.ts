import { beforeAll, expect, test } from 'bun:test';

import { CodeView } from '../src/components/CodeView';
import {
  createRoot,
  installDom,
  makeFile,
  makeFileItem,
  preloadTestHighlighter,
  renderItems,
  wait,
} from './domHarness';

beforeAll(preloadTestHighlighter);

test('growing an annotation updates the rendered window after resize delivery', async () => {
  const dom = installDom();
  const viewer = new CodeView({
    renderAnnotation: () => document.createElement('div'),
  });
  try {
    viewer.setup(createRoot());
    await renderItems(viewer, [
      {
        id: 'annotated',
        type: 'file',
        file: makeFile('annotated.ts', 3),
        annotations: [{ lineNumber: 1 }],
      },
      makeFileItem('following', 3),
    ]);
    const [first, second] = viewer.getRenderedItems();
    const annotation = first.element.shadowRoot?.querySelector(
      '[data-line-annotation]'
    );
    const sticky = first.element.parentElement;
    const row = second.element.shadowRoot?.querySelector('[data-line="1"]');
    if (annotation == null || sticky == null || row == null) {
      throw new Error('Expected two rendered files and an annotation');
    }
    for (const line of first.element.shadowRoot?.querySelectorAll(
      '[data-line]'
    ) ?? []) {
      line.getBoundingClientRect = () => new window.DOMRect(0, 0, 1000, 20);
    }
    annotation.getBoundingClientRect = () =>
      new window.DOMRect(0, 0, 1000, 3000);
    sticky.getBoundingClientRect = () => new window.DOMRect(0, 0, 1000, 3300);
    dom.triggerResizeObserver(sticky);
    expect(row.isConnected).toBe(true);
    await wait();
    expect(row.isConnected).toBe(false);
  } finally {
    viewer.cleanUp();
    dom.cleanup();
  }
});
