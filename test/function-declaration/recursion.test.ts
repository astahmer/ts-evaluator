import test from "ava";
import {executeProgram} from "../setup/execute-program.js";
import {withTypeScript} from "../setup/ts-macro.js";

test("Can evaluate a CallExpression for a recursive function. #1", withTypeScript, (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`

			function fibonacci (num: number, memo: { [key: number]: number } = {}): number {
				if (memo[num]) return memo[num];
				if (num <= 1) return 1;

				return memo[num] = fibonacci(num - 1, memo) + fibonacci(num - 2, memo);
			}

			fibonacci(5);
		`,
		"fibonacci(5",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value, 8);
});
