import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import metadata from "./_data/metadata.js";

// this turns ![alt](src "title") into a <figure> with a <figcaption>
// built from the image title
function imageFigcaption(md) {
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
}

export default function (eleventyConfig) {
  // --- content ------------------------------------------------------------
  eleventyConfig.addPreprocessor("dontPublishDrafts", "*", (data, content) => {
    if (data.page.filePathStem.startsWith("/posts/") && !data.published) {
      if (process.env.ELEVENTY_RUN_MODE === "serve") {
        const draftBanner = "<p class=\"draft-banner\">draft - not published</p>\n\n";
        return `${draftBanner}${content}`;
      } else {
        return false;
      }
    }
  });

  // --- passthrough --------------------------------------------------------
  eleventyConfig.addPassthroughCopy("media/**/*.{jpg,jpeg,png,webp,gif,mp4}");
  eleventyConfig.addPassthroughCopy("css");

  // --- plugins ------------------------------------------------------------
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

  // --- filters ------------------------------------------------------------
  eleventyConfig.addFilter("readableDate", (d) =>
    d.toLocaleDateString("en-CA", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    })
  );

  eleventyConfig.addFilter("dateToISO", (d) => d.toISOString());

  // --- shortcodes ---------------------------------------------------------
  // for the 88x31 button wall on the /about page
  eleventyConfig.addPairedShortcode("buttons", (content) =>
    `<div class="button-wall">${content}</div>`
  );
  eleventyConfig.addShortcode("button", (src, href, alt = "") => {
    const img = `<img src="${src}" alt="${alt}" width="88" height="31" loading="lazy">`;
    return href ? `<a href="${href}">${img}</a>` : img;
  });

  // --- markdown -----------------------------------------------------------
  eleventyConfig.amendLibrary("md", imageFigcaption);

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk"
  };
}
