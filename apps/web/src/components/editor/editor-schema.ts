import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createGitHubBlock } from "./blocks/github-block";
import { createSharePointBlock } from "./blocks/sharepoint-block";
import { createFileEmbedBlock } from "./blocks/file-block";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    github: createGitHubBlock(),
    sharepoint: createSharePointBlock(),
    fileEmbed: createFileEmbedBlock(),
  },
});

export type NotedSchema = typeof schema;
