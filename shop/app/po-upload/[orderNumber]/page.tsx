import { generateRaisePoToken } from "@/lib/email";
import { isAdminAuthed } from "@/lib/auth";
import { notFound } from "next/navigation";
import PoUploadForm from "./PoUploadForm";

export default async function PoUploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string; raised?: string }>;
}) {
  const { orderNumber } = await params;
  const { t, raised } = await searchParams;

  const expected = generateRaisePoToken(orderNumber);
  const tokenValid = t && t === expected;
  const admin = await isAdminAuthed();

  if (!tokenValid && !admin) notFound();

  // Use real token if available, otherwise generate one for the upload API call
  const token = tokenValid ? t : expected;

  return <PoUploadForm orderNumber={orderNumber} token={token} justRaised={raised === "true"} />;
}
