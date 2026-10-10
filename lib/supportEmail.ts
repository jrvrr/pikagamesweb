export const countWords = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
