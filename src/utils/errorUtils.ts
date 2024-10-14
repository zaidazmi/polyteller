import { log } from './logUtils';

export class PolytellerError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PolytellerError';
  }
}

export function handleError(error: Error | PolytellerError): void {
  if (error instanceof PolytellerError) {
    log('Error', `[${error.code}] ${error.message}`);
  } else {
    log('Error', error.message);
  }
  // You could add error reporting logic here
}

