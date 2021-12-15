import {isThisExpression} from "../util/node/is-this-expression";
import {THIS_SYMBOL} from "../util/this/this-symbol";
import {isSuperExpression} from "../util/node/is-super-expression";
import {SUPER_SYMBOL} from "../util/super/super-symbol";
import {EvaluatorOptions} from "../evaluator/evaluator-options";
import {TS} from "../../type/ts";

/**
 * Gets the path to "dot" into an object with based on the node. For example, if the node is a simple identifier, say, 'foo', the dot path is simply "foo".
 * And, if it is a PropertyAccessExpression, that path may be "console.log" for example
 */
export function getDotPathFromNode<T extends TS.Node>(options: EvaluatorOptions<T>): string | undefined {
	const {node, evaluate, typescript, environment, statementTraversalStack} = options;
	if (typescript.isIdentifier(node)) {
		return node.text;
	} else if (typescript.isPrivateIdentifier?.(node)) {
		return node.text;
	} else if (isThisExpression(node, typescript)) {
		return THIS_SYMBOL;
	} else if (isSuperExpression(node, typescript)) {
		return SUPER_SYMBOL;
	} else if (typescript.isParenthesizedExpression(node)) {
		return getDotPathFromNode({...options, node: node.expression});
	} else if (typescript.isTypeAssertion(node)) {
		return getDotPathFromNode({...options, node: node.expression});
	} else if (typescript.isPropertyAccessExpression(node)) {
		let leftHand = getDotPathFromNode({...options, node: node.expression});
		if (leftHand == null) leftHand = evaluate.expression(node.expression, environment, statementTraversalStack) as string;
		let rightHand = getDotPathFromNode({...options, node: node.name});
		if (rightHand == null) rightHand = evaluate.expression(node.name, environment, statementTraversalStack) as string;

		if (leftHand == null || rightHand == null) return undefined;
		return `${leftHand}.${rightHand}`;
	} else if (typescript.isElementAccessExpression(node)) {
		let leftHand = getDotPathFromNode({...options, node: node.expression});
		if (leftHand == null) leftHand = evaluate.expression(node.expression, environment, statementTraversalStack) as string;
		const rightHand = evaluate.expression(node.argumentExpression, environment, statementTraversalStack) as string;

		if (leftHand == null || rightHand == null) return undefined;
		return `${leftHand}.${rightHand}`;
	} else if (typescript.isFunctionDeclaration(node)) {
		if (node.name == null) return undefined;
		return node.name.text;
	}

	return undefined;
}
