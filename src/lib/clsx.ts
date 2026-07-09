type ClassValue = string | number | boolean | undefined | null;

export function clsx(...args: ClassValue[]): string {
  return args.filter(Boolean).join(" ");
}
