import {EvaluatorOptions} from "./evaluator-options.js";
import {Literal} from "../literal/literal.js";
import {TS} from "../../type/ts.js";

/**
 * Evaluates, or attempts to evaluate, a NullLiteral
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function evaluateNullLiteral(_options: EvaluatorOptions<TS.NullLiteral>): Literal {
	return null;
}
