import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://lori.my.id/",
    title: "Lori's Page",
    description:
      "This is a blog written by Lori where the topic is about IT, find Lori's writing.",
    author: "Lori",
    profile: "https://lori.my.id/",
    lang: "en",
    timezone: "Asia/Jakarta",
    dir: "ltr",
  },
  posts: {
    perPage: 3,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/chud-lori/lori-page/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/chud-lori" },
    { name: "linkedin", url: "https://www.linkedin.com/in/chud-lori/" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
