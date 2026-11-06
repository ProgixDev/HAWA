import type React from 'react';
import type {LayoutChangeEvent, ScrollView} from 'react-native';

export type ReadingControlsProps = {
  articleId: string;
  durationMinutes: number;
  scrollRef: React.RefObject<ScrollView | null>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

// The sticky "start reading / remaining time" card (and its timer) was removed: the reading-time counter added nothing and covered the
// bottom of every article. The component stays, rendering nothing, so the ~75 article screens that mount it need no edit; the scroll
// position is still saved by each screen's own onScroll.
function ReadingControls(_props: ReadingControlsProps): React.JSX.Element | null {
  return null;
}

export default ReadingControls;
