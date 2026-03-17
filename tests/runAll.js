/**
 * Run all test suites.
 *
 * Import this from test.html or run via a module-capable environment.
 */

import { summary, reset } from './testRunner.js';
import { runEconomyTests } from './economy.test.js';
import { runFiltrationTests } from './filtration.test.js';
import { runEventTests } from './events.test.js';
import { runStateTests } from './state.test.js';
import { runProgressionTests } from './progression.test.js';
import { runStoryTests } from './story.test.js';
import { runStaffTests } from './staff.test.js';
import { runResearchTests } from './research.test.js';
import { runRivalTests } from './rival.test.js';
import { runMediaTests } from './media.test.js';
import { runSaveLoadTests } from './saveload.test.js';
import { runGameLoopTests } from './gameloop.test.js';

reset();

console.log('Minor League Major Filtration — Test Suite');
console.log('============================\n');

// Engine tests
runStateTests();
runGameLoopTests();
runSaveLoadTests();

// Core system tests
runEconomyTests();
runFiltrationTests();
runEventTests();

// Game system tests
runProgressionTests();
runStoryTests();
runStaffTests();
runResearchTests();
runRivalTests();
runMediaTests();

const results = summary();

// Expose results globally for the HTML runner
if (typeof window !== 'undefined') {
  window.__testResults = results;
}
