let pinEnabled = false;
let biometricEnabled = false;

export const setPinEnabled = (enabled: boolean) => {
  pinEnabled = enabled;
};

export const isPinEnabled = () => pinEnabled;

export const setBiometricEnabled = (enabled: boolean) => {
  biometricEnabled = enabled;
};

export const isBiometricEnabled = () => biometricEnabled;
