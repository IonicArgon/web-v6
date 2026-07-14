import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import metadata from "./_data/metadata.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("media/**/*.{jpg,jpeg,png,webp,gif,mp4}");
  eleventyConfig.addPassthroughCopy("css");

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: {
      name: "posts",
      limit: 20,
    },
    metadata: {
      language: metadata.language,
      title: metadata.title,
      subtitle: metadata.description,
      base: metadata.url + "/",
      author: {
        name: metadata.author.name,
      },
    },
  });

  eleventyConfig.addFilter("readableDate", (d) =>
    d.toLocaleDateString("en-CA", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    })
  );

  eleventyConfig.addFilter("dateToISO", (d) => d.toISOString());

  // 88x31 button wall: emits real <img> HTML so buttons flow in a flex row
  // instead of stacking like default markdown images.
  eleventyConfig.addPairedShortcode("buttons", (content) =>
    `<div class="button-wall">${content}</div>`
  );

  eleventyConfig.addShortcode("button", (src, href, alt = "") => {
    const img = `<img src="${src}" alt="${alt}" width="88" height="31" loading="lazy">`;
    return href ? `<a href="${href}">${img}</a>` : img;
  });

  // for markddown, ![alt](src "title") -> use title as figure caption
  eleventyConfig.amendLibrary("md", (md) => {
    md.core.ruler.push("image_figcaption", (state) => {
      const tokens = state.tokens;

      for (let i = 0; i < tokens.length; i++) {
        const inline = tokens[i];

        if (
          inline.type !== "inline" ||
          tokens[i - 1]?.type !== "paragraph_open" ||
          tokens[i + 1]?.type !== "paragraph_close" ||
          inline.children.length !== 1 ||
          inline.children[0].type !== "image"
        ) continue;

        const image = inline.children[0];
        const titleIdx = image.attrIndex("title");
        if (titleIdx < 0) continue;

        const caption = image.attrs[titleIdx][1];
        image.attrs.splice(titleIdx, 1);

        tokens[i - 1].tag = "figure";
        tokens[i + 1].tag = "figure";

        const figcaption = new state.Token("html_inline", "", 0);
        figcaption.content = `<figcaption>${md.utils.escapeHtml(caption)}</figcaption>`;
        inline.children.push(figcaption);
      }
    });
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk"
  };
}
