import {createTestContext, TestContext} from "./test-context.js";
import {FileSystem} from "../../src/type/file-system.js";
import {createTestFileStructure, TestFile, TestFileEntry, TestFileStructure} from "./test-file.js";
import {createVirtualFileSystem} from "./create-virtual-file-system.js";
import {TS} from "../../src/type/ts.js";
import {createCompilerHost} from "./create-compiler-host.js";
import {MaybeArray, PartialExcept} from "helpertypes";

export interface TestSetup {
	context: TestContext;
	fileSystem: FileSystem;
	fileStructure: TestFileStructure;
	compilerHost: TS.CompilerHost;
}

export function createTestSetup(inputFiles: MaybeArray<TestFile>, entry: TestFileEntry, options: PartialExcept<TestContext, "typescript">): TestSetup {
	const context = createTestContext(options);
	const fileStructure = createTestFileStructure(inputFiles, entry, context);
	const fileSystem = createVirtualFileSystem(fileStructure.files);
	const compilerHost = createCompilerHost({
		fileSystem,
		typescript: context.typescript,
		cwd: fileStructure.dir.root
	});
	return {
		context,
		fileStructure,
		fileSystem,
		compilerHost
	};
}
