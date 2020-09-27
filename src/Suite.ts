/* eslint-env node, mocha */
import assert from 'assert';
import each from 'lodash/each';
import groupBy from 'lodash/groupBy';
import * as Options from './Options';
import * as ProcessedStory from './ProcessedStory';
import * as Result from './Result';
import * as TestBrowser from './TestBrowser';

const options = Options.parse();

/**
 * Find Storybook stories and generate a test for each one.
 */
async function writeTests() {
  const [browser, context] = await TestBrowser.create(options);
  const page = await TestBrowser.createPage(context, options);
  const stories = await TestBrowser.getStories(page);
  const storiesByComponent = groupBy(stories, 'componentTitle');

  describe(`[${options.browser}] accessibility`, function () {
    after(async function () {
      await browser.close();
    });

    each(storiesByComponent, (stories, componentTitle) => {
      describe(componentTitle, () => {
        stories.forEach((story) => {
          const testFn = ProcessedStory.isEnabled(story) ? it : it.skip;

          testFn(story.name, async function () {
            const result = await Result.fromPage(page, story);

            if (Result.isPassing(result)) {
              assert.ok(true);
            } else {
              assert.fail('\n' + Result.formatViolations(result));
            }
          });
        });
      });
    });
  });

  // Magic function injected by Mocha, signalling that the tests have been defined and are ready to
  // be ran. Only works because `delay: true` is passed to the Mocha constructor in index.ts.
  run();
}

writeTests();
