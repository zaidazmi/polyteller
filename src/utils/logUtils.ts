export function log(context: string, ...args: any[]): void {
    console.log(`[Polyteller ${context}]`, ...args);
  }