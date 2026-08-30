/*
 * Canonical tenant-day streak arithmetic for the static prototype.
 *
 * This is demonstration/state logic only. Production streak qualification and
 * persistence must be authoritative in the backend, using tenant-local
 * calendar rules and idempotent activity receipts. localStorage and this
 * browser-side object are not production authority.
 */
(function(root){
  "use strict";

  const QUALIFYING_ACTIVITIES = Object.freeze([
    "daily-quiz",
    "poll-response",
    "event-rsvp",
    "voice-submission"
  ]);

  const OUTCOMES = Object.freeze({
    INCREMENTED: "incremented",
    ALREADY_QUALIFIED: "already-qualified",
    RESET_AND_STARTED: "reset-and-started",
    RECESS_PAUSED: "recess-paused"
  });

  const TENANT_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

  function inputError(field, detail){
    throw new TypeError(`Invalid streak input: ${field}${detail ? ` ${detail}` : ""}.`);
  }

  function hasOwn(input, field){
    return Object.prototype.hasOwnProperty.call(input, field);
  }

  function assertInputObject(input){
    if(!input || typeof input!=="object" || Array.isArray(input)){
      inputError("input", "must be an object");
    }
  }

  function daysInMonth(year, month){
    if(month===2){
      const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      return leap ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  }

  // Tenant days are strict calendar values. This is the single date semantic
  // shared by the mutation and read-projection boundaries.
  function isValidTenantDay(value, allowNull=false){
    if(value===null && allowNull) return true;
    if(typeof value!=="string") return false;
    const match = TENANT_DAY_PATTERN.exec(value);
    if(!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
  }

  function assertTenantDay(value, field, allowNull=false){
    if(value===null && allowNull) return;
    if(typeof value!=="string") inputError(field, "must be a canonical YYYY-MM-DD string or null");
    if(!TENANT_DAY_PATTERN.test(value)) inputError(field, "must use canonical YYYY-MM-DD format");
    if(!isValidTenantDay(value)) inputError(field, "must be a valid calendar date");
  }

  function assertActivityType(activityType){
    if(!QUALIFYING_ACTIVITIES.includes(activityType)){
      inputError("activityType", "must be one of the four canonical qualifying activities");
    }
  }

  function assertStreak(currentStreak){
    if(typeof currentStreak!=="number" || !Number.isInteger(currentStreak) || currentStreak<0){
      inputError("currentStreak", "must be an integer greater than or equal to zero");
    }
  }

  function assertBoolean(value, field){
    if(typeof value!=="boolean") inputError(field, "must be a boolean");
  }

  // Pure current-state projection for visible streak surfaces. It uses only
  // canonical tenant-day facts and never reads the clock, DOM, or storage.
  function deriveCurrentStreak(input){
    assertInputObject(input);

    ["currentStreak", "tenantDay", "isInRecess"].forEach(field=>{
      if(!hasOwn(input, field)) inputError(field, "is required");
    });

    const lastQualifiedTenantDay = hasOwn(input, "lastQualifiedTenantDay")
      ? input.lastQualifiedTenantDay
      : null;
    const previousActiveTenantDay = hasOwn(input, "previousActiveTenantDay")
      ? input.previousActiveTenantDay
      : null;

    assertTenantDay(input.tenantDay, "tenantDay");
    assertTenantDay(lastQualifiedTenantDay, "lastQualifiedTenantDay", true);
    assertTenantDay(previousActiveTenantDay, "previousActiveTenantDay", true);
    assertStreak(input.currentStreak);
    assertBoolean(input.isInRecess, "isInRecess");

    const currentStreak = input.currentStreak;
    const tenantDay = input.tenantDay;

    if(input.isInRecess){
      return Object.freeze({
        streak: currentStreak,
        lastQualifiedTenantDay,
        qualifiedToday: false,
        resetForMissedDay: false,
        paused: true,
        status: "recess-paused"
      });
    }

    if(lastQualifiedTenantDay===tenantDay){
      return Object.freeze({
        streak: currentStreak,
        lastQualifiedTenantDay,
        qualifiedToday: true,
        resetForMissedDay: false,
        paused: false,
        status: "active-today"
      });
    }

    if(lastQualifiedTenantDay!==null && lastQualifiedTenantDay===previousActiveTenantDay){
      return Object.freeze({
        streak: currentStreak,
        lastQualifiedTenantDay,
        qualifiedToday: false,
        resetForMissedDay: false,
        paused: false,
        status: "continuing"
      });
    }

    // A positive count with no last-qualified day is incoherent and cannot
    // prove an active streak. A missing previous active day likewise cannot
    // prove continuity, so a historical positive streak is shown as reset;
    // no device-time inference is permitted.
    const missed = currentStreak > 0 && lastQualifiedTenantDay!==null;
    return Object.freeze({
      streak: 0,
      lastQualifiedTenantDay,
      qualifiedToday: false,
      resetForMissedDay: missed,
      paused: false,
      status: missed ? "missed-reset" : "not-started"
    });
  }

  function applyQualifyingActivity(input){
    assertInputObject(input);

    ["activityType", "tenantDay", "currentStreak", "isInRecess"].forEach(field=>{
      if(!hasOwn(input, field)) inputError(field, "is required");
    });

    const lastQualifiedTenantDay = hasOwn(input, "lastQualifiedTenantDay")
      ? input.lastQualifiedTenantDay
      : null;
    const previousActiveTenantDay = hasOwn(input, "previousActiveTenantDay")
      ? input.previousActiveTenantDay
      : null;

    assertActivityType(input.activityType);
    assertTenantDay(input.tenantDay, "tenantDay");
    assertTenantDay(lastQualifiedTenantDay, "lastQualifiedTenantDay", true);
    assertTenantDay(previousActiveTenantDay, "previousActiveTenantDay", true);
    assertStreak(input.currentStreak);
    assertBoolean(input.isInRecess, "isInRecess");

    const currentStreak = input.currentStreak;
    const tenantDay = input.tenantDay;

    if(input.isInRecess){
      return Object.freeze({
        streak: currentStreak,
        lastQualifiedTenantDay,
        qualifiedToday: false,
        outcome: OUTCOMES.RECESS_PAUSED
      });
    }

    if(lastQualifiedTenantDay===tenantDay){
      return Object.freeze({
        streak: currentStreak,
        lastQualifiedTenantDay,
        qualifiedToday: true,
        outcome: OUTCOMES.ALREADY_QUALIFIED
      });
    }

    if(lastQualifiedTenantDay!==null && lastQualifiedTenantDay===previousActiveTenantDay){
      return Object.freeze({
        streak: currentStreak + 1,
        lastQualifiedTenantDay: tenantDay,
        qualifiedToday: true,
        outcome: OUTCOMES.INCREMENTED
      });
    }

    return Object.freeze({
      streak: 1,
      lastQualifiedTenantDay: tenantDay,
      qualifiedToday: true,
      outcome: currentStreak===0 && lastQualifiedTenantDay===null
        ? OUTCOMES.INCREMENTED
        : OUTCOMES.RESET_AND_STARTED
    });
  }

  root.CampusHubStreak = Object.freeze({
    applyQualifyingActivity,
    deriveCurrentStreak,
    isValidTenantDay,
    QUALIFYING_ACTIVITIES
  });
})(window);
