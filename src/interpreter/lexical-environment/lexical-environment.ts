import {IndexLiteral, Literal, LiteralMatch} from "../literal/literal";
import {del, get, has, set} from "object-path";
import {IEvaluatePolicySanitized} from "../policy/i-evaluate-policy";
import {createSanitizedEnvironment} from "../environment/create-sanitized-environment";
import {ECMA_GLOBALS} from "../environment/ecma/ecma-globals";
import {NODE_GLOBALS} from "../environment/node/node-globals";
import {IEnvironment} from "../environment/i-environment";
import {EnvironmentPresetKind} from "../environment/environment-preset-kind";
import {BROWSER_GLOBALS} from "../environment/browser/browser-globals";
import {mergeDescriptors} from "../util/descriptor/merge-descriptors";

export interface LexicalEnvironment {
	parentEnv: LexicalEnvironment|undefined;
	env: IndexLiteral;
}

/**
 * Gets a value from a Lexical Environment
 * @param {LexicalEnvironment} env
 * @param {string} path
 * @returns {LexicalEnvironment["env]|undefined}
 */
export function getRelevantDictFromLexicalEnvironment (env: LexicalEnvironment, path: string): LexicalEnvironment["env"]|undefined {
	const [firstBinding] = path.split(".");
	if (has(env.env, firstBinding)) return env.env;
	if (env.parentEnv != null) return getRelevantDictFromLexicalEnvironment(env.parentEnv, path);
	return undefined;
}

/**
 * Gets a value from a Lexical Environment
 * @param {LexicalEnvironment} env
 * @param {string} path
 * @returns {LiteralMatch?}
 */
export function getFromLexicalEnvironment (env: LexicalEnvironment, path: string): LiteralMatch|undefined {
	const [firstBinding] = path.split(".");
	if (has(env.env, firstBinding)) return {literal: get(env.env, path)};
	if (env.parentEnv != null) return getFromLexicalEnvironment(env.parentEnv, path);
	return undefined;
}

/**
 * Returns true if the given lexical environment contains a value on the given path that equals the given literal
 * @param {LexicalEnvironment} env
 * @param {Literal} equals
 * @param {string[]} matchPaths
 * @returns {boolean}
 */
export function pathInLexicalEnvironmentEquals (env: LexicalEnvironment, equals: Literal, ...matchPaths: string[]): boolean {
	return matchPaths.some(path => {
		const match = getFromLexicalEnvironment(env, path);
		return match == null ? false : match.literal === equals;
	});
}

/**
 * Gets a value from a Lexical Environment
 * @param {LexicalEnvironment} env
 * @param {string} path
 * @param {Literal} value
 * @param {boolean} [newBinding=false]
 */
export function setInLexicalEnvironment (env: LexicalEnvironment, path: string, value: Literal, newBinding: boolean = false): void {
	const [firstBinding] = path.split(".");
	if (has(env.env, firstBinding) || newBinding || env.parentEnv == null) {
		set(env.env, path, value);
	}

	else {
		let currentParentEnv: LexicalEnvironment|undefined = env.parentEnv;
		while (currentParentEnv != null) {
			if (has(currentParentEnv.env, firstBinding)) {
				set(currentParentEnv.env, path, value);
				return;
			}
			else {
				currentParentEnv = currentParentEnv.parentEnv;
			}
		}
	}
}

/**
 * Clears a binding from a Lexical Environment
 * @param {LexicalEnvironment} env
 * @param {string} path
 */
export function clearBindingFromLexicalEnvironment (env: LexicalEnvironment, path: string): void {
	const [firstBinding] = path.split(".");
	if (has(env.env, firstBinding)) {
		del(firstBinding);
	}

	else {
		let currentParentEnv: LexicalEnvironment|undefined = env.parentEnv;
		while (currentParentEnv != null) {
			if (has(currentParentEnv.env, firstBinding)) {
				del(currentParentEnv.env, path);
				return;
			}
			else {
				currentParentEnv = currentParentEnv.parentEnv;
			}
		}
	}
}

/**
 * Creates a Lexical Environment
 * @param {IEnvironment} inputEnvironment
 * @param {IEvaluatePolicySanitized} policy
 * @returns {Promise<LexicalEnvironment>}
 */
export function createLexicalEnvironment ({preset, extra}: IEnvironment, policy: IEvaluatePolicySanitized): LexicalEnvironment {

	let envInput: IndexLiteral;

	switch (preset) {
		case EnvironmentPresetKind.NONE:
			envInput = mergeDescriptors(extra);
			break;

		case EnvironmentPresetKind.ECMA:
			envInput = mergeDescriptors(ECMA_GLOBALS(), extra);
			break;

		case EnvironmentPresetKind.NODE:
			envInput = mergeDescriptors(NODE_GLOBALS(), extra);
			break;

		case EnvironmentPresetKind.BROWSER:
			envInput = mergeDescriptors(BROWSER_GLOBALS(), extra);
			break;

		default:
			envInput = {};
			break;
	}

	return {
		parentEnv: undefined,
		env: createSanitizedEnvironment({
			policy,
			env: envInput
		})
	};
}