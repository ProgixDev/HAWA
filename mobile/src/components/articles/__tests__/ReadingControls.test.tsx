import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import ReadingControls from '../ReadingControls';

describe('ReadingControls', () => {
  it('renders nothing: the reading-time card and its timer were removed from every article', () => {
    const renderer = ReactTestRenderer.create(
      <ReadingControls articleId="test-article" durationMinutes={5} scrollRef={{current: null}} />,
    );
    expect(renderer.toJSON()).toBeNull();
  });
});
