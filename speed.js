/*
 * DFCH V1 - official expedition speed formulas confirmed from 3.16.0 IL2CPP.
 *
 * ExpeditionLevelLogic.CalcAverageWalkSpdLevel:
 *   leader weight = 2
 *   each member weight = 1
 *   avg = (2 * leaderWalkSpdLevel + sum(memberWalkSpdLevels)) / (2 + memberCount)
 *   WalkSpeedMultiplier = 0.8 + (avg / 100) * 3.2
 *
 * BattlerParamCalculator.CalculatePartyMemberCount:
 *   totalPartySlots = max(1, floor(leadership / 20) + 1)
 *
 * Important:
 * - The expedition formula reads UniqueStatusData.GetTotalLevel(statusType = 2).
 * - This is NOT the same thing as directly averaging the visible km/s value.
 * - Mapping the visible per-character km/s back to the internal walk-speed level
 *   will be added after the character/master-data path is fully recovered.
 */
(() => {
  const OFFICIAL = Object.freeze({
    leaderWeight: 2,
    memberWeight: 1,
    speedBase: 0.8,
    speedRange: 3.2,
    speedLevelDivisor: 100,
    leadershipPerSlot: 20,
    currentUiHardCapTotal: 12,
    currentUiHardCapMembers: 11
  });

  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function calcPartySlotCount(leadership) {
    const value = normalizeNumber(leadership);
    if (value === null) return 1;
    return Math.max(1, Math.floor(value / OFFICIAL.leadershipPerSlot) + 1);
  }

  function calcAverageWalkSpdLevel(leaderLevel, memberLevels = []) {
    const leader = normalizeNumber(leaderLevel);
    if (leader === null) return null;

    const members = memberLevels.map(normalizeNumber);
    if (members.some((value) => value === null)) return null;

    const weightedTotal =
      leader * OFFICIAL.leaderWeight +
      members.reduce((sum, value) => sum + value * OFFICIAL.memberWeight, 0);

    const totalWeight =
      OFFICIAL.leaderWeight +
      members.length * OFFICIAL.memberWeight;

    return weightedTotal / totalWeight;
  }

  function calcWalkSpeedMultiplier(averageWalkSpdLevel) {
    const level = normalizeNumber(averageWalkSpdLevel);
    if (level === null) return null;
    return OFFICIAL.speedBase + (level / OFFICIAL.speedLevelDivisor) * OFFICIAL.speedRange;
  }

  function calcPartyWalkSpeed({ leaderLevel, memberLevels = [] }) {
    const averageLevel = calcAverageWalkSpdLevel(leaderLevel, memberLevels);
    if (averageLevel === null) {
      return {
        averageLevel: null,
        multiplier: null
      };
    }

    return {
      averageLevel,
      multiplier: calcWalkSpeedMultiplier(averageLevel)
    };
  }

  window.DFCHSpeed = Object.freeze({
    OFFICIAL,
    calcPartySlotCount,
    calcAverageWalkSpdLevel,
    calcWalkSpeedMultiplier,
    calcPartyWalkSpeed
  });
})();
