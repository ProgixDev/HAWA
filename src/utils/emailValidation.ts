const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}
