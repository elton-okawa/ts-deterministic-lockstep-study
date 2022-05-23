export interface Input {
  frame: number;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;

}

export function inputEquals(first: Input, second: Input): boolean {
  if (first.frame !== second.frame) {
    console.warn(`Comparing inputs from different frames (current: ${first.frame}, other: ${first.frame})`);
  }

  return first.up === second.up &&
    first.down === second.down &&
    first.left === second.left &&
    first.right === second.right &&
    first.jump === second.jump;
}
