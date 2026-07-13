export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("posts/**/*.{jpg,jpeg,png,webp,gif,mp4}");
  eleventyConfig.addPassthroughCopy("css");

  eleventyConfig.addFilter("readableDate", (d) =>
    d.toLocaleDateString("en-CA", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    })
  );

  eleventyConfig.addFilter("dateToISO", (d) => d.toISOString());

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk"
  };
}
