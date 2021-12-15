import { TS } from "../../src/type/ts";
import { FileSystem } from "../../src/type/file-system";
import {CachedWorker, CachedWorkerOptions} from "./cached-worker";

export interface CachedFsWorkerOptions extends CachedWorkerOptions {
	fs: TS.System | FileSystem;
}

export class CachedFs extends CachedWorker<CachedFsWorkerOptions> {
	readFile(file: string): string | undefined {
		return this.work(file, () => {
			if ("readFileSync" in this.options.fs) {
				try {
					return this.options.fs.readFileSync(file, "utf8");
				} catch {
					return undefined;
				}
			} else {
				return this.options.fs.readFile(file);
			}
		});
	}
}
