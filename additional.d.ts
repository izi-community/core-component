// additional.d.ts
import {AriaAttributes, DOMAttributes} from "react";

declare module '@nhuson/react-d3-cloud' {
  // Basic type definitions or leave as is if not using the module extensively
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}

declare module "*.jpeg" { const value: string; export = value; }
declare module "*.jpg" { const value: string; export = value; }
declare module "*.png" { const value: string; export = value; }
declare module "*.gif" { const value: string; export = value; }
declare module "*.ico" { const value: string; export = value; }
declare module "*.webp" { const value: string; export = value; }
declare module "*.jp2" { const value: string; export = value; }
declare module "*.avif" { const value: string; export = value; }

declare global {
  function gtag(event: string, eventName?: string, data?: object): void;
}

interface Window {
  trainizi: any; // Ideally, replace 'any' with a more specific type
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    width?: number | string; // No need to redeclare everything, just add your custom attributes
  }
}
