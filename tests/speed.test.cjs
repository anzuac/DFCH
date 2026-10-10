const assert = require('node:assert/strict');
global.window = {};
require('../speed.js');
const S = window.DFCHSpeed;
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
for (const level of [0, 40, 79.999, 80, 100, 230]) {
  close(S.levelFromActualWalkSpeed(S.actualWalkSpeedFromLevel(level)), level);
  close(S.levelFromVisibleWalkSpeed(S.visibleWalkSpeedFromLevel(level, 150), 150), level);
}
close(S.calcFromVisibleSpeeds({leaderSpeed: '0.750'}).multiplier, 3.36);
const a = S.calcFromVisibleSpeeds({leaderSpeed: '0.577', memberSpeeds: ['0.520', '0.480']});
close(a.averageLevel, ((0.577 - 0.05) * 2 + 0.520 - 0.05 + 0.480 - 0.05) / 0.00875 / 4);
close(a.multiplier, 0.8 + a.averageLevel * 0.032);
const b = S.calcFromVisibleSpeeds({leaderSpeed: '0.480', memberSpeeds: ['0.520', '0.577']});
assert.ok(a.multiplier > b.multiplier);
for (const invalid of ['', 'abc', -1, 0, 0.049]) assert.equal(S.calcFromVisibleSpeeds({leaderSpeed: invalid}).ready, false);
assert.equal(S.calcFromVisibleSpeeds({leaderSpeed: 0.5, memberSpeeds: ['']}).ready, false);
assert.equal(S.calcFromVisibleSpeeds({leaderSpeed: 0.5, memberSpeeds: Array(12).fill(0.5)}).ready, false);
close(S.calcFromVisibleSpeeds({leaderSpeed: 0.75, memberSpeeds: Array(11).fill(0.75)}).multiplier, 3.36);
console.log('Speed checks passed; sample party:', a.multiplier);
