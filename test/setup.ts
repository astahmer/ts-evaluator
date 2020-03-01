import {LogLevelKind} from "../src/interpreter/logger/log-level";
import {evaluate} from "../src/interpreter/evaluate";
import {EvaluateResult} from "../src/interpreter/evaluate-result";
import {
	CompilerOptions,
	createProgram,
	createSourceFile,
	Expression,
	forEachChild,
	getDefaultCompilerOptions,
	getDefaultLibFileName,
	Node,
	NodeArray,
	ScriptKind,
	ScriptTarget,
	SourceFile,
	Statement,
	sys
} from "typescript";
import {IEvaluatePolicy} from "../src/interpreter/policy/i-evaluate-policy";
import {readFileSync, readdirSync} from "fs";
import {IEnvironment} from "../src/interpreter/environment/i-environment";
import {ReportingOptions} from "../src/interpreter/reporting/i-reporting-options";
import {sync} from "find-up";
import {join, normalize} from "path";
import slash from "slash";

// tslint:disable:no-any

export interface ITestFile {
	fileName: string;
	text: string;
}

export type TestFile = ITestFile | string;

export interface ITestFileEntry {
	fileName: string;
	match: string;
}

export type TestFileEntry = ITestFileEntry | string;

export interface ITestFileResult {
	evaluate(): EvaluateResult;
}

export interface ITestOpts {
	policy: Partial<IEvaluatePolicy>;
	environment: Partial<IEnvironment>;
	reporting: ReportingOptions;
	logLevel: LogLevelKind;
}

/**
 * Prepares a test
 */
export function prepareTest(
	files: TestFile[] | TestFile,
	entry?: TestFileEntry | undefined,
	{
		environment,
		policy: {
			deterministic = true,
			maxOps = Infinity,
			maxOpDuration = Infinity,
			console = false,
			network = false,
			io = {
				read: true,
				write: false
			},
			process = {
				exit: false,
				spawnChild: false
			}
		} = {},
		reporting,
		logLevel = LogLevelKind.SILENT
	}: Partial<ITestOpts> = {}
): ITestFileResult {
	const arrFiles = Array.isArray(files) ? files : [files];
	const nodeTypesDir = sync(normalize("node_modules/@types/node"), {type: "directory"});
	const nodeTypeDeclarationFiles =
		nodeTypesDir == null
			? []
			: readdirSync(nodeTypesDir)
					.filter(file => file.endsWith(".d.ts"))
					.map(file => join(nodeTypesDir, file));

	const normalizedFiles: ITestFile[] = [
		...arrFiles.map(file => (typeof file === "string" ? {text: file, fileName: `auto-generated-${Math.floor(Math.random() * 100000)}.ts`} : file)),
		...nodeTypeDeclarationFiles.map(file => ({
			fileName: file,
			text: readFileSync(normalize(file), "utf8")
		}))
	]
		.map(file => ({
			...file,
			fileName: slash(file.fileName)
		}));

	const normalizedEntry =
		typeof entry === "string" || entry == null ? {fileName: normalizedFiles[0].fileName, match: entry == null ? "" : entry} : entry;

	const rootNames = normalizedFiles.map(({fileName}) => fileName);

	const program = createProgram({
		rootNames,
		host: {
			readFile(fileName: string): string | undefined {
				const matchedFile = normalizedFiles.find(file => file.fileName === slash(fileName));
				return matchedFile == null ? undefined : matchedFile.text;
			},

			fileExists(fileName: string): boolean {
				return this.readFile(fileName) != null;
			},

			getSourceFile(fileName: string, languageVersion: ScriptTarget): SourceFile | undefined {
				const sourceText = this.readFile(fileName);
				if (sourceText == null) return undefined;

				return createSourceFile(slash(fileName), sourceText, languageVersion, true, ScriptKind.TS);
			},

			getCurrentDirectory() {
				return ".";
			},

			getDirectories(directoryName: string) {
				return sys.getDirectories(slash(directoryName)).map(slash);
			},

			getDefaultLibFileName(options: CompilerOptions): string {
				return slash(getDefaultLibFileName(options));
			},

			getCanonicalFileName(fileName: string): string {
				return slash(this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase());
			},

			getNewLine(): string {
				return sys.newLine;
			},

			useCaseSensitiveFileNames() {
				return sys.useCaseSensitiveFileNames;
			},

			writeFile: () => {
				// Noop
			}
		},
		options: getDefaultCompilerOptions()
	});

	const entrySourceFile = program.getSourceFile(normalizedEntry.fileName);
	if (entrySourceFile == null) {
		throw new ReferenceError(`No such SourceFile: '${normalizedEntry.fileName}'`);
	}

	const entryNode = findEntryExpressionFromStatements(entrySourceFile.statements, normalizedEntry.match);

	return {
		evaluate: () =>
			evaluate({
				node: entryNode,
				typeChecker: program.getTypeChecker(),
				environment,
				reporting,
				policy: {
					maxOps,
					maxOpDuration,
					deterministic,
					io,
					process,
					network,
					console
				},
				logLevel
			})
	};
}

/**
 * Finds an entry node that matches the given text with a NodeArray of Statements
 */
function findEntryExpressionFromStatements(statements: NodeArray<Statement>, match: string): Expression {
	for (const statement of statements) {
		const matchedNode = matchNode(statement, match);
		if (matchedNode != null) return matchedNode;
	}
	throw new ReferenceError(`Could not match: '${match}' inside NodeArray of Statements`);
}

/**
 * Checks if the given text matches the given node or any of its' children
 */
function matchNode(node: Node, match: string): Expression | undefined {
	if (isNodeMatched(node, match)) return node;
	return forEachChild(node, nextNode => matchNode(nextNode, match));
}

/**
 * Returns true if the given Node matches the given text
 */
function isNodeMatched(node: Node, match: string): node is Expression {
	try {
		if (node.getText().startsWith(match)) return true;
	} catch {}
	return false;
}
