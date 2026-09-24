/**
 * The recordings, read out of git at the revision `AGENTS.md` W8 names, without a checkout.
 *
 * `captures/` lives on `develop`, and touching it is asked first on any branch, so this reads git's
 * objects and writes nothing. A recording arrives as `unknown` and is walked rather than cast: a
 * shape a recording does not have is a finding, not a field that quietly reads `undefined`.
 */

import { assert, assertStrictEquals } from "@std/assert";

export const RECORDINGS_REVISION = "fa1dcce";

const RECORDINGS_DIRECTORY = "captures/";
const RECORDING_EXTENSION = ".json";

/** The recording's own keys, as `develop:src/game/fight-capture.ts` spells them (N13). */
const CAPTURE_FIELDS = { calls: "calls", messages: "messages" } as const;

export interface RecordedMessages {
    path: string;
    messages: string[];
}

export function readRecordedMessages(): RecordedMessages[] {
    const paths = readGitText(["ls-tree", "--name-only", RECORDINGS_REVISION, RECORDINGS_DIRECTORY])
        .split("\n")
        .filter((line) => line.endsWith(RECORDING_EXTENSION));
    assert(paths.length > 0, "an empty evidence directory is a finding, not a pass");
    assertStrictEquals(new Set(paths).size, paths.length, "a recording is listed once");
    return paths.map((path) => {
        const text = readGitText(["show", `${RECORDINGS_REVISION}:${path}`]);
        return { path, messages: readRecordedMessagesOfFile(path, JSON.parse(text)) };
    });
}

function readRecordedMessagesOfFile(path: string, document: unknown): string[] {
    assert(typeof document === "object", `${path} is a record`);
    assert(document !== null, `${path} is a record, not null`);
    const calls: unknown = Reflect.get(document, CAPTURE_FIELDS.calls);
    assert(Array.isArray(calls), `${path} lists the calls the engine made`);
    const messages: string[] = [];
    for (const call of calls) {
        assert(typeof call === "object", `${path} states a call as a record`);
        assert(call !== null, `${path} states a call as a record, not null`);
        const carried: unknown = Reflect.get(call, CAPTURE_FIELDS.messages);
        assert(Array.isArray(carried), `${path} states the messages a call carried`);
        for (const message of carried) {
            assert(typeof message === "string", `${path} carries a message as text`);
            messages.push(message);
        }
    }
    return messages;
}

function readGitText(args: string[]): string {
    const output = new Deno.Command("git", { args, stdout: "piped", stderr: "piped" }).outputSync();
    const error = new TextDecoder().decode(output.stderr);
    assert(output.success, `git ${args.join(" ")} answered: ${error}`);
    return new TextDecoder().decode(output.stdout);
}
