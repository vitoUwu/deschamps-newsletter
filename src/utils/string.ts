/**
 * Slices a string into chunks of a given maximum length.
 * @param text - The text to slice.
 * @param maxLength - The maximum length of each chunk.
 * @returns An array of strings, each representing a chunk of the original text.
 * @example
 * sliced("Hello, world!", 5); // ["Hello", ", world!", "!"]
 */
function sliced(text: string, maxLength: number): string[] {
  return text.match(new RegExp(`.{1,${maxLength}}`, "gs")) || [];
}

const StringUtils = {
  sliced,
};

export default StringUtils;
