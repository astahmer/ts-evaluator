import test from "ava";
import {executeProgram} from "../setup/execute-program.js";
import {withTypeScriptVersions} from "../setup/ts-macro.js";

test("Supports nullish coalescing with null-like values. #1", withTypeScriptVersions(">=3.7"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			const foo = "";
			const bar = foo ?? "bar";
		`,
		`foo ?? "bar"`,
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, "");
	}
});
