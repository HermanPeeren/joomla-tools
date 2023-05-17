import { stat } from 'node:fs/promises';
import pkgFsJetpack from 'fs-jetpack';
import { handleESMToLegacy } from './compile-to-es5.mjs';


import { logger } from './utils/logger.mjs';
import { handleES5File } from './javascript/handleES5.mjs';
import { handleESMFile } from './javascript/handleESMFile.mjs';

const { find } = pkgFsJetpack;
const RootPath = process.cwd();

/**
 * Method that will crawl the media_source folder and
 * compile ES6 to ES5 and ES6
 * copy any ES5 files to the appropriate destination and
 * minify them in place
 * compile any custom elements/webcomponents
 *
 * Expects ES6 files to have ext: .es6.js
 *         ES5 files to have ext: .es5.js
 *         WC/CE files to have ext: .w-c.es6.js
 *
 * @param { string } path    The folder that needs to be compiled, optional
 * @param { string } mode    esm for ES2017, es5 for ES5, both for both
 */
async function scripts(path) {
  const files = [];
  const folders = [];

  if (path) {
    const stats = await stat(`${RootPath}/${path}`);

    if (stats.isDirectory()) {
      folders.push(`${RootPath}/${path}`);
    } else if (stats.isFile()) {
      files.push(`${RootPath}/${path}`);
    } else {
      logger(`Unknown path ${path}`);
      process.exit(1);
    }
  } else {
    folders.push(`${RootPath}/media_source`);
  }

  // Loop to get the files that should be compiled via parameter
  const computedFiles = await Promise.all(folders.map(folder => find(folder, { matching: ['*.+(mjs|js)'] })));

  Promise.all([
    ...[].concat(...computedFiles).filter(file => file.endsWith('.js')).map(hanler => handleES5File(hanler)),
    ...[].concat(...computedFiles).filter(file => file.endsWith('.mjs')).map(hanler => handleESM(hanler)),
  ]);
};

async function handleESM(inputFile) {
  if (!globalThis.searchPath || !globalThis.replacePath) {
    throw new Error(`Global searchPath and replacePath are not defined`);
  }

  const outputFile = file.replace(/\.mjs$/, '.js').replace(`${globalThis.searchPath}`, globalThis.replacePath);
  await handleESMFile(inputFile, outputFile);

  if (globalThis.supportES5) {
    await handleESMToLegacy(outputFile, `${outputFile.replace(/\.js$/, '-es5.js')}`);
  }
}

export { scripts };
