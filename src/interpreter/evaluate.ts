import * as TSModule from "typescript";
import {EvaluateOptions} from "./evaluate-options.js";
import {createLexicalEnvironment} from "./lexical-environment/lexical-environment.js";
import {EvaluateResult} from "./evaluate-result.js";
import {evaluateSimpleLiteral} from "./evaluator/simple/evaluate-simple-literal.js";
import {createNodeEvaluator} from "./evaluator/node-evaluator/create-node-evaluator.js";
import {LogLevelKind} from "./logger/log-level.js";
import {Logger} from "./logger/logger.js";
import {createStatementTraversalStack} from "./stack/traversal-stack/statement-traversal-stack.js";
import {isExpression} from "./util/expression/is-expression.js";
import {Literal} from "./literal/literal.js";
import {isStatement} from "./util/statement/is-statement.js";
import {createStack, Stack} from "./stack/stack.js";
import {isDeclaration} from "./util/declaration/is-declaration.js";
import {UnexpectedNodeError} from "./error/unexpected-node-error/unexpected-node-error.js";
import {EvaluatePolicySanitized} from "./policy/evaluate-policy.js";
import {reportError} from "./util/reporting/report-error.js";
import {createReportedErrorSet} from "./reporting/reported-error-set.js";
import {ReportingOptionsSanitized} from "./reporting/i-reporting-options.js";
import {TS} from "../type/ts.js";
import {EvaluationError} from "./error/evaluation-error/evaluation-error.js";

/**
 * Will get a literal value for the given Expression, ExpressionStatement, or Declaration.
 */
export function evaluate({
	typeChecker,
	node,
	environment: {preset = "NODE", extra = {}} = {},
	moduleOverrides = {},
	typescript = TSModule,
	logLevel = LogLevelKind.SILENT,
	policy: {
		deterministic = false,
		network = false,
		console = false,
		maxOps = Infinity,
		maxOpDuration = Infinity,
		io = {
			read: true,
			write: false
		},
		process = {
			exit: false,
			spawnChild: false
		}
	} = {},
	reporting: reportingInput = {}
}: EvaluateOptions): EvaluateResult {
	// Take the simple path first. This may be far more performant than building up an environment
	const simpleLiteralResult = evaluateSimpleLiteral(node, typescript);
	if (simpleLiteralResult.success) return simpleLiteralResult;

	// Otherwise, build an environment and get to work
	// Sanitize the evaluation policy based on the input options
	const policy: EvaluatePolicySanitized = {
		deterministic,
		maxOps,
		maxOpDuration,
		network,
		console,
		io: {
			read: typeof io === "boolean" ? io : io.read,
			write: typeof io === "boolean" ? io : io.write
		},
		process: {
			exit: typeof process === "boolean" ? process : process.exit,
			spawnChild: typeof process === "boolean" ? process : process.spawnChild
		}
	};

	// Sanitize the Reporting options based on the input options
	const reporting: ReportingOptionsSanitized = {
		...reportingInput,
		reportedErrorSet: createReportedErrorSet()
	};

	// Prepare a reference to the Node that is currently being evaluated
	let currentNode: TS.Node = node;

	// Prepare a logger
	const logger = new Logger(logLevel);

	// Prepare the initial environment
	const initialEnvironment = createLexicalEnvironment({
		inputEnvironment: {
			preset,
			extra
		},
		policy,
		getCurrentNode: () => currentNode
	});

	// Prepare a Stack
	const stack: Stack = createStack();

	// Prepare a NodeEvaluator
	const nodeEvaluator = createNodeEvaluator({
		policy,
		typeChecker,
		typescript,
		logger,
		stack,
		moduleOverrides,
		reporting: reporting,
		nextNode: nextNode => (currentNode = nextNode)
	});

	try {
		let value: Literal;
		if (isExpression(node, typescript)) {
			value = nodeEvaluator.expression(node, initialEnvironment, createStatementTraversalStack());
		} else if (isStatement(node, typescript)) {
			nodeEvaluator.statement(node, initialEnvironment);
			value = stack.pop();
		} else if (isDeclaration(node, typescript)) {
			nodeEvaluator.declaration(node, initialEnvironment, createStatementTraversalStack());
			value = stack.pop();
		}

		// Otherwise, throw an UnexpectedNodeError
		else {
			// noinspection ExceptionCaughtLocallyJS
			throw new UnexpectedNodeError({node, typescript});
		}

		// Log the value before returning
		logger.logResult(value);

		return {
			success: true,
			value
		};
	} catch (reason) {
		// Report the Error
		reportError(reporting, reason as EvaluationError, node);

		return {
			success: false,
			reason: reason as EvaluationError
		};
	}
}
