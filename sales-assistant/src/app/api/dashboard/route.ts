import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { getDashboardStats } from "@/lib/dashboard";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
