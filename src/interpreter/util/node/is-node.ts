import { TS } from "../../../type/ts";

 export function isTypescriptNode<T extends TS.Node>(node: T|unknown): node is T {
    return node != null && typeof node === "object" && "kind" in node && "flags" in node && "pos" in node && "end" in node;
}
