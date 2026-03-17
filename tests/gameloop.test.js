/**
 * GameLoop Tests
 *
 * Tests game loop construction, speed control, pause/resume,
 * and public getters.
 */

import { describe, it, assert } from './testRunner.js';
import { GameLoop } from '../src/engine/GameLoop.js';

export function runGameLoopTests() {

  describe('GameLoop -- construction', () => {
    it('should create with update and render functions', () => {
      const loop = new GameLoop(() => {}, () => {});
      assert.equal(loop.running, false);
      assert.equal(loop.paused, false);
      assert.equal(loop.speed, 1);
    });

    it('should expose fixedDt', () => {
      const loop = new GameLoop(() => {}, () => {});
      assert.approximately(loop.fixedDt, 1 / 60, 0.001);
    });
  });

  describe('GameLoop -- speed control', () => {
    it('should accept valid speed values (1, 2, 3)', () => {
      const loop = new GameLoop(() => {}, () => {});
      loop.setSpeed(2);
      assert.equal(loop.speed, 2);
      loop.setSpeed(3);
      assert.equal(loop.speed, 3);
      loop.setSpeed(1);
      assert.equal(loop.speed, 1);
    });

    it('should ignore invalid speed values', () => {
      const loop = new GameLoop(() => {}, () => {});
      loop.setSpeed(5);
      assert.equal(loop.speed, 1, 'Should remain at default');
      loop.setSpeed(0);
      assert.equal(loop.speed, 1);
      loop.setSpeed(-1);
      assert.equal(loop.speed, 1);
    });
  });

  describe('GameLoop -- pause/resume', () => {
    it('should pause and resume', () => {
      const loop = new GameLoop(() => {}, () => {});
      loop.pause();
      assert.equal(loop.paused, true);
      loop.resume();
      assert.equal(loop.paused, false);
    });

    it('should not resume if not paused', () => {
      const loop = new GameLoop(() => {}, () => {});
      assert.equal(loop.paused, false);
      loop.resume(); // Should be a no-op
      assert.equal(loop.paused, false);
    });
  });

  describe('GameLoop -- start/stop', () => {
    it('should set running state on start', () => {
      const loop = new GameLoop(() => {}, () => {});
      loop.start();
      assert.equal(loop.running, true);
      loop.stop(); // cleanup
      assert.equal(loop.running, false);
    });

    it('should not double-start', () => {
      const loop = new GameLoop(() => {}, () => {});
      loop.start();
      loop.start(); // Should be no-op
      assert.equal(loop.running, true);
      loop.stop();
    });
  });
}
