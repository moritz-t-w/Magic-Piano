export const getExpressionBox = (rollType) => {
  if (rollType === "welte-red") {
    const expBox = {
      welte_p: 35.0,
      welte_mf: 65.0,
      welte_f: 85.0,
      welte_loud: 70.0,
      left_adjust: -5,
      cresc_rate: 1.0,
      slow_decay_rate: 2380,
      fastC_decay_rate: 300,
      fastD_decay_rate: 400,
    };
    expBox.slow_step =
      (expBox.welte_mf - expBox.welte_p) / expBox.slow_decay_rate;
    expBox.fastC_step =
      (expBox.welte_mf - expBox.welte_p) / expBox.fastC_decay_rate;
    expBox.fastD_step =
      (expBox.welte_f - expBox.welte_p) / expBox.fastD_decay_rate;
    return expBox;
  }
  return null;
};

export const rollProfile = {
  "welte-red": {
    bassCtrlBegin: 14,
    bassCtrlEnd: 23,
    bassNotesBegin: 24,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 103,
    trebleCtrlBegin: 104,
    trebleCtrlEnd: 113,
    ctrlMap: {
      14: "mf_off",
      15: "mf_on",
      16: "cresc_off",
      17: "cresc_on",
      18: "sf_off",
      19: "sf_on",
      20: "soft_off",
      21: "soft_on",
      22: "motor_off",
      23: "motor_on",
      104: "rewind",
      105: "elec_off",
      106: "sust_on",
      107: "sust_off",
      108: "sf_on",
      109: "sf_off",
      110: "cresc_on",
      111: "cresc_off",
      112: "mf_on",
      113: "mf_off",
    },
  },
  "welte-green": {
    bassCtrlBegin: 16,
    bassCtrlEnd: 20,
    bassNotesBegin: 21,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 108,
    trebleCtrlBegin: 109,
    trebleCtrlEnd: 113,
    ctrlMap: {
      16: "sfp",
      17: "mf",
      18: "sust",
      19: "cresc",
      20: "sff",
      109: "sff",
      110: "cresc",
      111: "soft",
      112: "mf",
      113: "sfp",
    },
  },
  "welte-licensee": {
    bassCtrlBegin: 16,
    bassCtrlEnd: 23,
    bassNotesBegin: 24,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 103,
    trebleCtrlBegin: 104,
    trebleCtrlEnd: 113,
    ctrlMap: {
      16: "mf_off",
      17: "mf_on",
      18: "cresc_off",
      19: "cresc_on",
      20: "sf_on",
      21: "sf_off",
      22: "soft_on",
      23: "soft_off",
      104: "rewind",
      106: "sust_on",
      107: "sust_off",
      108: "sf_on",
      109: "sf_off",
      110: "cresc_on",
      111: "cresc_off",
      112: "mf_on",
      113: "mf_off",
    },
  },
  "65-note": {
    bassNotesBegin: 33,
    trebleNotesEnd: 97,
  },
  "88-note": {
    bassCtrlBegin: 15,
    bassCtrlEnd: 20,
    bassNotesBegin: 21,
    bassNotesEnd: 64,
    trebleNotesBegin: 65,
    trebleNotesEnd: 108,
    trebleCtrlBegin: 109,
    trebleCtrlEnd: 110,
    ctrlMap: {
      16: "rewind",
      18: "sust",
      19: "acc",
      20: "acc",
      109: "acc",
      110: "acc",
    },
  },
};
