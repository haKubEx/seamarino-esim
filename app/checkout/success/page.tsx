import CheckoutSuccessClient from "./CheckoutSuccessClient";

interface SuccessPageProps {
  searchParams: Promise<{
    reference?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { reference } =
    await searchParams;

  const safeReference =
    reference?.trim() ?? "";

  return (
    <CheckoutSuccessClient
      reference={safeReference}
    />
  );
}