import {EvaluatorOptions} from "./evaluator-options.js";
import {IndexLiteral, stringifyLiteral} from "../literal/literal.js";
import {NotCallableError} from "../error/not-callable-error/not-callable-error.js";
import {TS} from "../../type/ts.js";
import {__decorate, __param} from "../util/tslib/tslib-util.js";
import {EvaluationError} from "../error/evaluation-error/evaluation-error.js";

/**
 * Evaluates, or attempts to evaluate, a Decorator
 */
export function evaluateDecorator(options: EvaluatorOptions<TS.Decorator>, [parent, propertyName, index]: [IndexLiteral, string?, number?]): void | EvaluationError {
	const {node, evaluate, environment, throwError, stack, getCurrentError} = options;
	const decoratorImplementation = evaluate.expression(node.expression, options);

	if (getCurrentError() != null) {
		return;
	}

	if (typeof decoratorImplementation !== "function") {
		return throwError(
			new NotCallableError({
				node,
				environment,
				value: decoratorImplementation,
				message: `${stringifyLiteral(decoratorImplementation)} is not a valid decorator implementation'`
			})
		);
	}

	stack.push(__decorate([index != null ? __param(index, decoratorImplementation) : decoratorImplementation], parent, propertyName));
}
