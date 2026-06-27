import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import path from "path";
import fs from "fs/promises";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { path: routePath } = resolvedParams;
    const filePath = path.join(
      process.cwd(),
      "private_storage",
      "uploads",
      ...routePath
    );

    // Secure the path to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.join(process.cwd(), "private_storage", "uploads"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const fileBuffer = await fs.readFile(normalizedPath);
      const ext = path.extname(normalizedPath).toLowerCase();
      
      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${path.basename(normalizedPath)}"`,
        },
      });
    } catch (error) {
      // Fallback: check if the file is in public/uploads (for old files)
      const fallbackPath = path.join(process.cwd(), "public", "uploads", ...routePath);
      try {
        const fileBuffer = await fs.readFile(fallbackPath);
        const ext = path.extname(fallbackPath).toLowerCase();
        
        let contentType = "application/octet-stream";
        if (ext === ".pdf") contentType = "application/pdf";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".png") contentType = "image/png";

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${path.basename(fallbackPath)}"`,
          },
        });
      } catch (fallbackError) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
