import {EvaluatorOptions} from "./evaluator-options.js";
import {Literal} from "../literal/literal.js";
import {cloneLexicalEnvironment} from "../lexical-environment/clone-lexical-environment.js";
import {UnexpectedNodeError} from "../error/unexpected-node-error/unexpected-node-error.js";
import {pathInLexicalEnvironmentEquals, setInLexicalEnvironment} from "../lexical-environment/lexical-environment.js";
import {BREAK_SYMBOL} from "../util/break/break-symbol.js";
import {CONTINUE_SYMBOL} from "../util/continue/continue-symbol.js";
import {RETURN_SYMBOL} from "../util/return/return-symbol.js";
import {TS} from "../../type/ts.js";
import {AsyncIteratorNotSupportedError} from "../error/async-iterator-not-supported-error/async-iterator-not-supported-error.js";
import {EvaluationError} from "../error/evaluation-error/evaluation-error.js";

/**
 * Evaluates, or attempts to evaluate, a ForOfStatement
 */
export function evaluateForOfStatement(options: EvaluatorOptions<TS.ForOfStatement>): void | EvaluationError {
	const {node, environment, evaluate, logger, typescript, throwError, getCurrentError} = options;
	// Compute the 'of' part
	const expressionResult = evaluate.expression(node.expression, options) as Iterable<Literal>;

	if (getCurrentError() != null) {
		return;
	}

	// Ensure that the initializer is a proper VariableDeclarationList
	if (!typescript.isVariableDeclarationList(node.initializer)) {
		return throwError(new UnexpectedNodeError({node: node.initializer, environment, typescript}));
	}

	// Only 1 declaration is allowed in a ForOfStatement
	else if (node.initializer.declarations.length > 1) {
		return throwError(new UnexpectedNodeError({node: node.initializer.declarations[1], environment, typescript}));
	}

	// As long as we only offer a synchronous API, there's no way to evaluate an async iterator in a synchronous fashion
	if (node.awaitModifier != null) {
		return throwError(new AsyncIteratorNotSupportedError({typescript, environment}));
	} else {
		for (const literal of expressionResult) {
			// Prepare a lexical environment for the current iteration
			const localEnvironment = cloneLexicalEnvironment(environment, node);
			const nextOptions = {...options, environment: localEnvironment};

			// Define a new binding for a break symbol within the environment
			setInLexicalEnvironment({...nextOptions, path: BREAK_SYMBOL, value: false, newBinding: true});

			// Define a new binding for a continue symbol within the environment
			setInLexicalEnvironment({...nextOptions, path: CONTINUE_SYMBOL, value: false, newBinding: true});

			// Evaluate the VariableDeclaration and manually pass in the current literal as the initializer for the variable assignment
			evaluate.nodeWithArgument(node.initializer.declarations[0], literal, nextOptions);

			if (getCurrentError() != null) {
				return;
			}

			// Evaluate the Statement
			evaluate.statement(node.statement, nextOptions);

			if (getCurrentError() != null) {
				return;
			}

			// Check if a 'break' statement has been encountered and break if so
			if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, BREAK_SYMBOL)) {
				logger.logBreak(node, typescript);
				break;
			} else if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, CONTINUE_SYMBOL)) {
				logger.logContinue(node, typescript);
				// noinspection UnnecessaryContinueJS
				continue;
			} else if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, RETURN_SYMBOL)) {
				logger.logReturn(node, typescript);
				return;
			}
		}
	}
}
