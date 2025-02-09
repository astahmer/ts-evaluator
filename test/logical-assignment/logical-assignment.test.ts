import test from "ava";
import {executeProgram} from "../setup/execute-program.js";
import {withTypeScriptVersions} from "../setup/ts-macro.js";

test("Supports logical assignment. #1", withTypeScriptVersions(">=4.0"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			(() => {
				let values: string[];
				(values ??= []).push("hello");
				return values;
			})();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, ["hello"]);
	}
});

test("Supports logical assignment. #2", withTypeScriptVersions(">=4.0"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			(() => {
				let values: string[] = ["hi"];
				(values ??= []).push("hello");
				return values;
			})();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, ["hi", "hello"]);
	}
});

test("Supports logical assignment. #3", withTypeScriptVersions(">=4.0"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			(() => {
				let a;
				let b = "foo";
				a ||= b;
				return a;
			})();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, "foo");
	}
});

test("Supports logical assignment. #4", withTypeScriptVersions(">=4.0"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			(() => {
				let a = "foo";
				let b = "bar";
				a ||= b;
				return a;
			})();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, "foo");
	}
});

test("Supports logical assignment. #5", withTypeScriptVersions(">=4.0"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			(() => {
				let a = "foo";
				let b = "bar";
				a &&= b;
				return a;
			})();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, "bar");
	}
});

test("Supports logical assignment. #6", withTypeScriptVersions(">=4.0"), (t, {typescript, useTypeChecker}) => {
	const {result} = executeProgram(
		// language=TypeScript
		`
			(() => {
				let a;
				let b = "bar";
				a &&= b;
				return a;
			})();
		`,
		"(() =>",
		{typescript, useTypeChecker}
	);

	if (!result.success) t.fail(result.reason.stack);
	else {
		t.deepEqual(result.value, undefined);
	}
});
