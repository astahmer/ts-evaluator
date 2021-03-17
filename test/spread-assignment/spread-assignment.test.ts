import test from "ava";
import {prepareTest} from "../setup";
import {withTypeScript} from "../util/ts-macro";

test("Can handle Spread assignments to objects. #1", withTypeScript, (t, {typescript}) => {
	const {evaluate} = prepareTest(
		// language=TypeScript
		`
			(() => {
				const a = {
					a: 1,
					b: 2
				};
				const b = {
					...a,
					c: 3
				}
				return b;
			})();
		`,
		"(() =>",
		{typescript}
	);

	const result = evaluate();

	if (!result.success) t.fail(result.reason.stack);
	else t.deepEqual(result.value as {a: number; b: number; c: number}, {a: 1, b: 2, c: 3});
});
