import test from "ava";
import {prepareTest} from "../setup";
import {withTypeScript} from "../util/ts-macro";

test("Can evaluate a simple '(number, number) => number' function. #1", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			function add (a: number, b: number): number {
				return a + b;
			}

			add(1, 2);
		`,
		"add(",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 3);
});

test("Can evaluate a simple '(number, number) => number' function. #2", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			function minus (a: number, b: number): number {
				return a - b;
			}

			minus(1, 2);
		`,
		"minus(",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, -1);
});

test("Can evaluate a simple '(number, number) => number' function. #3", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			function multiply (a: number, b: number): number {
				return a * b;
			}

			multiply(1, 2);
		`,
		"multiply(",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 2);
});

test("Can evaluate a simple '(number, number) => number' function. #4", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			function divide (a: number, b: number): number {
				return a / b;
			}

			divide(1, 2);
		`,
		"divide(",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 0.5);
});

test("Can evaluate a simple 'number => number' function. #1", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			function square (a: number): number {
				return a ** 2;
			}

			square(2);
		`,
		"square(",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 4);
});

test("Can handle the 'arguments' identifier. #1", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			function square (a: number): number {
				return arguments[0] ** 2;
			}

			square(2);
		`,
		"square(",
		{
			typescript,
			policy: {
				console: true
			}
		}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 4);
});
