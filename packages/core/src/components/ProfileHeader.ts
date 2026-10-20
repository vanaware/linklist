/**
 * @file ProfileHeader.ts
 * @description Avatar, name, tagline and (Markdown) bio for the bio header.
 */
import { html, } from "htm/preact";
import type { Profile, } from "../lib/types.ts";
import { MarkdownText, } from "./MarkdownText.ts";

export interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile, }: ProfileHeaderProps,) {
  return html`
    <header class="profile">
      ${profile.avatar
        ? html`
          <img
            class="avatar"
            src=${profile.avatar}
            alt=${profile.avatar_alt ?? ""}
            width="96"
            height="96"
          />
        `
        : null}
      <h1 class="name">${profile.name}</h1>
      ${profile.tagline
        ? html`
          <p class="tagline">
            <${MarkdownText} text=${profile.tagline} inline=${true} />
          </p>
        `
        : null}
      ${profile.bio
        ? html`
          <div class="bio">
            <${MarkdownText} text=${profile.bio} />
          </div>
        `
        : null}
      ${profile.location
        ? html`
          <p class="location">
            <i class="icon" aria-hidden="true">place</i>${profile.location}
          </p>
        `
        : null}
    </header>
  `;
}
