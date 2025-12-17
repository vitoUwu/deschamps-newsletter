interface WithRetryOptions {
  retries?: number;
  delay?: number;
  approach?: "exponential" | "linear";
}

export function withRetry<TFunction extends (...args: any[]) => any>(
  fn: TFunction,
  options: WithRetryOptions = {
    retries: 3,
    delay: 1000,
    approach: "exponential",
  }
) {
  const { retries = 3, delay = 1000, approach = "exponential" } = options;

  const getDelay = (attempt: number) => {
    if (approach === "exponential") {
      return delay * Math.pow(2, attempt);
    }
    return delay * attempt;
  };

  return async (
    ...args: Parameters<TFunction>
  ): Promise<ReturnType<TFunction>> => {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        lastError = error as Error;
        await new Promise((resolve) => setTimeout(resolve, getDelay(i)));
      }
    }
    throw lastError;
  };
}
