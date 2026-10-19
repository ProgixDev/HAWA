import {installAwaShapes} from './awaShapeLayer';
import {installAwaTypography} from './awaTypography';

// Imported for its side effect at the very top of index.js: the DESIGN.md typography and shape layers must be in
// place before any screen module calls StyleSheet.create or renders text.
installAwaShapes();
installAwaTypography();
