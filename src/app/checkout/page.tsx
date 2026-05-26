import { getRestaurantCheckoutClover } from "@/app/actions/getCloverCheckout";

type CheckoutPageProps = {
  searchParams: Promise<{
    order_id?: string;
  }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { order_id: orderId } = await searchParams;

  if (!orderId) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">Checkout Clover</h1>
        <p className="mt-4 text-red-600">
          Missing query parameter: <strong>order_id</strong>
        </p>
      </main>
    );
  }

  let data: unknown = null;
  let errorMessage: string | null = null;

  try {
    data = await getRestaurantCheckoutClover(orderId);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Checkout Clover</h1>
      <p className="mt-2 text-sm text-zinc-600">Order ID: {orderId}</p>

      {errorMessage ? (
        <p className="mt-4 text-red-600">{errorMessage}</p>
      ) : (
        <pre className="mt-6 overflow-auto rounded-md bg-zinc-950 p-4 text-sm text-zinc-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
