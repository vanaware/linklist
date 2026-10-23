/**
 * @file ImageBlock.ts
 * @description A standalone image/figure block (config v2 `figure` format) — an
 * image not tied to a link, with an optional caption. The validator guarantees
 * `image` has an `image_alt`, so the `<img>` always carries alt text. A `framed`
 * one (from `format: "card_figure"`) is wrapped in an `<article>`: in BeerCSS the
 * card surface (elevation + padding + radius + tinted background) is carried by
 * the `article` ELEMENT, not a `.card` class — so an `<article>` (not a bare
 * `<figure>`) is what actually reads as a card, matching the islands.
 */
import { html, } from "htm/preact";
import type { ImageBlock as ImageBlockData, } from "../lib/types.ts";

export interface ImageBlockProps {
  block: ImageBlockData;
}

function figure(block: ImageBlockData,) {
  return html`
    <figure class="block-image">
      <img class="round" src=${block.image} alt=${block.image_alt} loading="lazy" />
      ${block.caption
      ? html`<figcaption class="small-text">${block.caption}</figcaption>`
      : null}
    </figure>
  `;
}

export function ImageBlock({ block, }: ImageBlockProps,) {
  return block.framed
    ? html`<article class="card block-framed">${figure(block,)}</article>`
    : figure(block,);
}
