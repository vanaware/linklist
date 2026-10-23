/**
 * @file ImageBlock.ts
 * @description A standalone image/figure block (config v2 `figure` format) — an
 * image not tied to a link, with an optional caption. The validator guarantees
 * `image` has an `image_alt`, so the `<img>` always carries alt text.
 */
import { html, } from "htm/preact";
import type { ImageBlock as ImageBlockData, } from "../lib/types.ts";

export interface ImageBlockProps {
  block: ImageBlockData;
}

export function ImageBlock({ block, }: ImageBlockProps,) {
  return html`
    <figure class="block-image">
      <img class="round" src=${block.image} alt=${block.image_alt} loading="lazy" />
      ${block.caption
      ? html`<figcaption class="small-text">${block.caption}</figcaption>`
      : null}
    </figure>
  `;
}
