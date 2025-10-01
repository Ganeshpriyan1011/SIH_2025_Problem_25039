// Allow using <ion-icon> in TSX without type errors
// This augments the global JSX namespace for custom elements
declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      name?: string;
      class?: string;
      className?: string;
    };
  }
}
