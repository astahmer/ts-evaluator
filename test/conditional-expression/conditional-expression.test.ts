import test from "ava";
import {prepareTest} from "../setup";
import {withTypeScript} from "../util/ts-macro";

test("Can handle ConditionalExpressions. #1", withTypeScript, (t, {typescript}) => {
	// noinspection BadExpressionStatementJS
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			// noinspection RedundantConditionalExpressionJS
			(() => 2 + 2 === 5 ? true : false)()
		`,
		"(() =>",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, false);
	}
});

test("Can handle ConditionalExpressions. #2", withTypeScript, (t, {typescript}) => {
	// noinspection BadExpressionStatementJS
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			// noinspection RedundantConditionalExpressionJS
			(() => 2 + 2 === 4 ? true : false)()
		`,
		"(() =>",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, true);
	}
});
