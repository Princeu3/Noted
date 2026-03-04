import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createGitHubBlock } from "./blocks/github-block";
import { createSharePointBlock } from "./blocks/sharepoint-block";
import { createFileEmbedBlock } from "./blocks/file-block";
import { createPdfBlock } from "./blocks/pdf-block";
import { createDocxBlock } from "./blocks/docx-block";
import { createLinkEmbedBlock } from "./blocks/link-embed-block";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    github: createGitHubBlock(),
    sharepoint: createSharePointBlock(),
    fileEmbed: createFileEmbedBlock(),
    pdf: createPdfBlock(),
    docx: createDocxBlock(),
    linkEmbed: createLinkEmbedBlock(),
  },
});

export type NotedSchema = typeof schema;
