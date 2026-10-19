import fs from 'fs';
import path from 'path';

// Material 3 migration (DESIGN.md): the bespoke article screens render their chrome and copy through the shared
// components in src/components/ui instead of hand-rolled Pressable circles and raw Text. This is a source-level guard
// (like the structural audits in Phase7JArticleAccessibility); the behaviour is covered by the render tests next to it.

const DIR = path.resolve(__dirname, '..');
const files = fs.readdirSync(DIR).filter(name => /ArticleScreen\.tsx$/.test(name));

describe('article screens use the shared Material 3 components', () => {
  it('covers every bespoke article', () => {
    expect(files.length).toBe(73);
  });

  it.each(files)('%s: header actions are AwaIconButton, copy is AwaText', file => {
    const source = fs.readFileSync(path.join(DIR, file), 'utf8');
    expect(source).toMatch(/import \{AwaIconButton\} from '\.\.\/\.\.\/components\/ui\/AwaIconButton';/);
    expect(source).toMatch(/import \{AwaText\} from '\.\.\/\.\.\/components\/ui\/AwaText';/);
    // back / bookmark / share
    expect((source.match(/<AwaIconButton/g) ?? []).length).toBe(3);
    // no hand-rolled circle button and no raw RN Text left in the render code
    expect(source).not.toMatch(/styles\.circle\b/);
    expect(source).not.toMatch(/<Text[\s>]/);
  });

  it.each(files)('%s: keeps the translated accessibility labels of the header actions', file => {
    const source = fs.readFileSync(path.join(DIR, file), 'utf8');
    expect(source).toMatch(/accessibilityLabel=\{t\('library\.reader\.back'\)\}/);
    expect(source).toMatch(/libraryArticle\.shareA11y|libraryArticle\.bookmarkA11y|library\.screen\.addBookmark/);
  });
});
