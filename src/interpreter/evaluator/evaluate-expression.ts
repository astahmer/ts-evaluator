import {EvaluatorOptions} from "./evaluator-options.js";
import {Literal} from "../literal/literal.js";
import {evaluateNode} from "./evaluate-node.js";
import {TS} from "../../type/ts.js";

/**
 * Will get a literal value for the given Expression. If it doesn't succeed, the value will be 'undefined'
 */
export function evaluateExpression(options: EvaluatorOptions<TS.Expression | TS.PrivateIdentifier>): Literal {
	const {getCurrentError} = options;
	options.logger.logNode(options.node, options.typescript);
	const value = evaluateNode(options) as Promise<Literal>;

	if (getCurrentError() != null) {
		return;
	}

	// Report intermediate results
	if (options.reporting.reportIntermediateResults != null) {
		options.reporting.reportIntermediateResults({
			node: options.node,
			value
		});
	}

	return value;
}
