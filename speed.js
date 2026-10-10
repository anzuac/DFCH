/*
 * DFCH - expedition speed research module
 * Baseline: game 3.16.0 / Unity 2022.3.62f2 / IL2CPP
 *
 * Player-facing UI should use only the visible walk speed (km/s).
 * Internal level conversion is kept in this module and must not be exposed
 * as a required player input.
 */
(() => {
  const OFFICIAL = Object.freeze({
    leaderWeight: 2,
    memberWeight: 1,

    // UniqueStatusData.GetActualValue(statusType = WalkSpd / internal index 2)
    walkBreakLevel: 80,
    walkLowBase: 0.05,
    walkLowSlope: 0.00875,
    walkHighBase: 0.75,
    walkHighSlope: 0.0035175872035324574,

    // ExpeditionLevelLogic.CalcAverageWalkSpdLevel
    expeditionBase: 0.8,
    expeditionRange: 3.2,
    expeditionLevelDivisor: 100,

    maxPartySize: 12,
    maxMembers: 11
  });

  function n(value) {
    if (value === "" || value === null || value === undefined) return null;
    const out = Number(value);
    return Number.isFinite(out) ? out : null;
  }

  // Internal status level -> the base walkSpd1 used by UniquePlayerParams.
  function actualWalkSpeedFromLevel(level) {
    const L = n(level);
    if (L === null) return null;

    if (L < OFFICIAL.walkBreakLevel) {
      return OFFICIAL.walkLowBase + L * OFFICIAL.walkLowSlope;
    }

    return OFFICIAL.walkHighBase +
      (L - OFFICIAL.walkBreakLevel) * OFFICIAL.walkHighSlope;
  }

  // Inverse of GetActualValue(WalkSpd).
  function levelFromActualWalkSpeed(actualSpeed) {
    const speed = n(actualSpeed);
    if (speed === null) return null;

    if (speed < OFFICIAL.walkHighBase) {
      return (speed - OFFICIAL.walkLowBase) / OFFICIAL.walkLowSlope;
    }

    return OFFICIAL.walkBreakLevel +
      (speed - OFFICIAL.walkHighBase) / OFFICIAL.walkHighSlope;
  }

  /*
   * UniquePlayerParams.get_walkSpd:
   * visibleWalkSpd = walkSpd1 * Skill2Value / 100
   *
   * Skill2Value is controlled by the active skill flow (UseCase_UseSkill).
   * OnFireEnd restores it to 100. UI accepts speeds with no active speed buff.
   */
  function visibleWalkSpeedFromLevel(level, skill2Percent) {
    const base = actualWalkSpeedFromLevel(level);
    const skill2 = n(skill2Percent);
    if (base === null || skill2 === null) return null;
    return base * skill2 / 100;
  }

  function levelFromVisibleWalkSpeed(visibleSpeed, skill2Percent) {
    const visible = n(visibleSpeed);
    const skill2 = n(skill2Percent);
    if (visible === null || visible < 0 || skill2 === null || skill2 <= 0) return null;

    const base = visible * 100 / skill2;
    if (base < OFFICIAL.walkLowBase) return null;
    return levelFromActualWalkSpeed(base);
  }

  function calcAverageWalkSpdLevel(leaderLevel, memberLevels = []) {
    const leader = n(leaderLevel);
    if (leader === null) return null;

    const members = memberLevels.map(n);
    if (members.some((value) => value === null)) return null;

    const weighted =
      leader * OFFICIAL.leaderWeight +
      members.reduce((sum, value) => sum + value * OFFICIAL.memberWeight, 0);

    return weighted /
      (OFFICIAL.leaderWeight + members.length * OFFICIAL.memberWeight);
  }

  function calcExpeditionWalkMultiplier(averageLevel) {
    const level = n(averageLevel);
    if (level === null) return null;

    return OFFICIAL.expeditionBase +
      (level / OFFICIAL.expeditionLevelDivisor) * OFFICIAL.expeditionRange;
  }

  function calcFromVisibleSpeeds({ leaderSpeed, memberSpeeds = [], skill2Percent = 100 }) {
    if (!Array.isArray(memberSpeeds) || memberSpeeds.length > OFFICIAL.maxMembers) {
      return { ready: false, reason: "party-size-invalid" };
    }
    const leaderLevel = levelFromVisibleWalkSpeed(leaderSpeed, skill2Percent);
    const memberLevels = memberSpeeds.map((speed) =>
      levelFromVisibleWalkSpeed(speed, skill2Percent)
    );

    if (leaderLevel === null || memberLevels.some((value) => value === null)) {
      return {
        ready: false,
        reason: "invalid-speed-or-correction",
        leaderLevel: null,
        memberLevels: [],
        averageLevel: null,
        multiplier: null
      };
    }

    const averageLevel = calcAverageWalkSpdLevel(leaderLevel, memberLevels);

    return {
      ready: true,
      leaderLevel,
      memberLevels,
      averageLevel,
      multiplier: calcExpeditionWalkMultiplier(averageLevel)
    };
  }

  window.DFCHSpeed = Object.freeze({
    OFFICIAL,
    actualWalkSpeedFromLevel,
    levelFromActualWalkSpeed,
    visibleWalkSpeedFromLevel,
    levelFromVisibleWalkSpeed,
    calcAverageWalkSpdLevel,
    calcExpeditionWalkMultiplier,
    calcFromVisibleSpeeds
  });
})();
