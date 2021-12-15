import test from "ava";
import {executeProgram} from "../setup/execute-program";
import {withTypeScript} from "../setup/ts-macro";

test("Can evaluate a CallExpression that is called with another 'this' value. #1", withTypeScript, (t, {typescript}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			const myObj = {
				someProp: 2
			};

			function myFunc (this: typeof myObj, a: number): number {
				return a + this.someProp;
			}

			myFunc.call(myObj, 2);
		`,
		"myFunc.call(",
		{typescript}
	);

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 4);
});

test("Can evaluate a CallExpression that is called with another 'this' value. #2", withTypeScript, (t, {typescript}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			const myObj = {
				someProp: 2
			};

			function myFunc (this: typeof myObj, a: number): number {
				return a + this.someProp;
			}

			myFunc.bind(myObj, 2)();
		`,
		"myFunc.bind(",
		{typescript}
	);

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 4);
});

test("Can evaluate a CallExpression that is called with another 'this' value. #3", withTypeScript, (t, {typescript}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			const myObj = {
				someProp: 2
			};

			function myFunc (this: typeof myObj, a: number): number {
				return a + this.someProp;
			}

			myFunc.apply(myObj, [2]);
		`,
		"myFunc.apply(",
		{typescript}
	);

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 4);
});
