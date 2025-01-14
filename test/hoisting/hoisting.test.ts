import test from "ava";
import {executeProgram} from "../setup/execute-program.js";
import {withTypeScript} from "../setup/ts-macro.js";
import {UndefinedIdentifierError} from "../../src/interpreter/error/undefined-identifier-error/undefined-identifier-error.js";
import {NotCallableError} from "../../src/interpreter/error/not-callable-error/not-callable-error.js";

test("Throws when attempting to reference an identifier that is still not defined within the current scope. #2", withTypeScript, (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			add(1, 2);

			const add = function (a: number, b: number): number {
				return a + b;
			}
		`,
		"add(",
		{typescript, useTypeChecker}
	);

	if (result.success) t.fail();
	else t.true(result.reason instanceof UndefinedIdentifierError);
});

test(
	"Doesn't throw when attempting to reference an identifier that is declared after the reference, but is hoisted to the current scope. #1",
	withTypeScript,
	(t, {typescript, useTypeChecker}) => {
		const {result} = executeProgram(
			// language=TypeScript
			`
			let myVar = add;

			var add = function (a: number, b: number): number {
				return a + b;
			};

			(() => myVar)();
		`,
			"(() =>",
			{typescript, useTypeChecker}
		);

		if (!result.success) t.fail(result.reason.stack);
		// myVar aliases 'add', but before add received an rvalue. My the time it was aliased, it was initialized to the primitive
		// value 'undefined', so myVar will still be assigned to undefined
		else t.deepEqual(result.value, undefined);
	}
);

test(
	"Throws when attempting to use the rvalue of a referenced identifier that is declared after the reference, but is hoisted to the current scope. #1",
	withTypeScript,
	(t, {typescript, useTypeChecker}) => {
		const {result} = executeProgram(
			// language=TypeScript
			`
			let myVar = add;

			var add = function (a: number, b: number): number {
				return a + b;
			};

			(() => myVar(1, 2))();
		`,
			"(() =>",
			{typescript, useTypeChecker}
		);

		if (result.success) t.fail();
		// The identifier is not undefined, but the rvalue is.
		else t.true(result.reason instanceof NotCallableError);
	}
);

test("Respects block scoped variables declared with 'let'. #1", withTypeScript, (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			{
				let a = 2;
			}
			(() => a)();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (result.success) t.fail();
	else t.true(result.reason instanceof UndefinedIdentifierError);
});

test("Respects block scoped variables declared with 'var'. #1", withTypeScript, (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			{
				var a = 2;
			}
			(() => a)();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 2);
});
