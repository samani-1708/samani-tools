import { NextResponse } from "next/server";
import { SITE_URL } from "@/app/common/seo";
import {
  PDF_TOOL_ROUTES,
  IMAGE_TOOL_ROUTES,
  UTILITY_TOOL_ROUTES,
} from "@/app/common/tool-routes";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/pdf",
  "/image",
  "/utils",
];

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "INDEXNOW_KEY not configured" },
      { status: 500 },
    );
  }

  const allRoutes = [
    ...STATIC_ROUTES,
    ...PDF_TOOL_ROUTES,
    ...IMAGE_TOOL_ROUTES,
    ...UTILITY_TOOL_ROUTES,
  ];

  const urlList = [...new Set(allRoutes)].map((path) => `${SITE_URL}${path}`);
  const host = new URL(SITE_URL).hostname;

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList,
    }),
  });

  return NextResponse.json({ status: res.status, submitted: urlList.length });
}
