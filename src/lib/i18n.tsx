import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "sw" | "sheng";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "sw", label: "Kiswahili" },
  { id: "sheng", label: "Sheng" },
];

const dict = {
  en: {
    home: "Home", post: "Post", groups: "Groups", market: "Market", events: "Events", profile: "Profile", login: "Log in",
    messages: "Messages", friendRequests: "Friend requests", language: "Language",
    feedPrompt: "What's on your mind", feedJoin: "Join Briva to share your moments",
    membersOnly: "Posts on Briva are for members only. Log in or sign up to see what people are sharing.",
    loginOrSignup: "Log in or sign up", noPosts: "No posts yet. Be the first!", loadingPosts: "Loading posts…",
    posts: "Posts", reels: "Reels", join: "Join", pending: "Pending", create: "Create", cancel: "Cancel",
    membersOnlyPage: "This page is for members only. Log in or sign up to continue.",
    noRequests: "No pending requests", like: "Like", comment: "Comment", writeComment: "Write a comment…", send: "Send",
  },
  sw: {
    home: "Nyumbani", post: "Chapisha", groups: "Vikundi", market: "Soko", events: "Matukio", profile: "Wasifu", login: "Ingia",
    messages: "Ujumbe", friendRequests: "Maombi ya urafiki", language: "Lugha",
    feedPrompt: "Unafikiria nini", feedJoin: "Jiunge na Briva kushiriki matukio yako",
    membersOnly: "Machapisho ya Briva ni kwa wanachama pekee. Ingia au jisajili kuona yanayoshirikiwa.",
    loginOrSignup: "Ingia au jisajili", noPosts: "Hakuna machapisho bado. Kuwa wa kwanza!", loadingPosts: "Inapakia machapisho…",
    posts: "Machapisho", reels: "Reels", join: "Jiunge", pending: "Inasubiri", create: "Tengeneza", cancel: "Ghairi",
    membersOnlyPage: "Ukurasa huu ni kwa wanachama pekee. Ingia au jisajili kuendelea.",
    noRequests: "Hakuna maombi yanayosubiri", like: "Penda", comment: "Maoni", writeComment: "Andika maoni…", send: "Tuma",
  },
  sheng: {
    home: "Home", post: "Post", groups: "Mbogi", market: "Soko", events: "Rada", profile: "Profaili", login: "Ingia",
    messages: "Mesej", friendRequests: "Request za mabeste", language: "Lengo",
    feedPrompt: "Unathink nini", feedJoin: "Join Briva ushare moments zako",
    membersOnly: "Post za Briva ni za members tu. Ingia ama sign up uone mambo.",
    loginOrSignup: "Ingia ama sign up", noPosts: "Bado hakuna post. Kuwa wa kwanza!", loadingPosts: "Inaload posts…",
    posts: "Post", reels: "Reels", join: "Join", pending: "Inangoja", create: "Tengeneza", cancel: "Achana",
    membersOnlyPage: "Hii page ni ya members tu. Ingia ama sign up uendelee.",
    noRequests: "Hakuna request zinangoja", like: "Like", comment: "Comment", writeComment: "Weka comment…", send: "Tuma",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

type Ctx = { lang: Lang; setLang: (lang: Lang) => void; t: (key: TKey) => string };
const LangCtx = createContext<Ctx | null>(null);
const KEY = "briva-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "en" || saved === "sw" || saved === "sheng") setLangState(saved);
  }, []);
  useEffect(() => { document.documentElement.lang = lang === "sheng" ? "sw" : lang; }, [lang]);
  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(KEY, next);
  };
  const t = (key: TKey) => dict[lang][key] ?? dict.en[key];
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLanguage outside provider");
  return ctx;
}
