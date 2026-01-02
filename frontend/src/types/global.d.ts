// Ambient global types to address build-time errors
declare var process: {
  env: { [key: string]: string | undefined };
};

declare module 'firebase/app';
declare module 'firebase/auth';
declare module 'firebase/firestore';
declare module 'firebase/functions';

export {};
