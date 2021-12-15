import {mergeDescriptors} from "../../util/descriptor/merge-descriptors";
import {ECMA_GLOBALS} from "../ecma/ecma-globals";
import {subtract} from "../../util/object/subtract";
import {rafImplementation} from "./lib/raf";
import {loadJsdom} from "../../util/loader/optional-peer-dependency-loader";

export const BROWSER_GLOBALS = () => {
	const {JSDOM} = loadJsdom(true);
	const {window} = new JSDOM("", {url: "https://example.com"});
	const ecmaGlobals = ECMA_GLOBALS();
	const raf = rafImplementation(window as unknown as Window & typeof globalThis);
	const merged = mergeDescriptors(subtract(window, ecmaGlobals as Partial<typeof window>), subtract(raf, window), ecmaGlobals);

	Object.defineProperties(merged, {
		window: {
			get(): typeof merged {
				return merged;
			}
		},
		globalThis: {
			get(): typeof merged {
				return merged;
			}
		}
	});

	return merged;
};
