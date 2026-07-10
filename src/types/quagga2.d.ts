// Type declarations for @ericblade/quagga2
declare module '@ericblade/quagga2' {
  export interface QuaggaJSConfigObject {
    inputStream?: {
      type?: string;
      target?: HTMLElement | null;
      constraints?: MediaStreamConstraints;
    };
    decoder?: {
      readers?: string[];
    };
    locate?: boolean;
  }

  export interface QuaggaJSResultObject {
    codeResult?: {
      code?: string;
    };
  }

  export default class Quagga {
    static init(
      config: QuaggaJSConfigObject,
      callback: (err: any) => void
    ): void;
    static start(): void;
    static stop(): void;
    static onDetected(callback: (result: QuaggaJSResultObject) => void): void;
  }
}
