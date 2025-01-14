import {EvaluationError} from "../evaluation-error/evaluation-error.js";
import {IAsyncIteratorNotSupportedErrorOptions} from "./i-async-iterator-not-supported-error-options.js";

/**
 * An Error that can be thrown when an async iteration operation is attempted
 */
export class AsyncIteratorNotSupportedError extends EvaluationError {
	constructor({message = `It is not possible to evaluate an async iterator'`, typescript, environment}: IAsyncIteratorNotSupportedErrorOptions) {
		super({message, environment, node: typescript.factory?.createEmptyStatement() ?? typescript.createEmptyStatement()});
	}
}
