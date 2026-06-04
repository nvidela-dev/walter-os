import { t } from "@/i18n";
import { expectedActionError } from "@/lib/action-result";
import { multiplyDecimalStrings, sumDecimalStrings } from "@/lib/money";
import type { InvoiceCreationRepository } from "@/lib/repositories/invoices";
import type { ValidatedCreateInvoiceInput } from "@/lib/validators/invoices";

export interface CreateInvoiceDependencies extends InvoiceCreationRepository {
  newId: () => string;
}

export async function createInvoiceUseCase(
  input: ValidatedCreateInvoiceInput,
  dependencies: CreateInvoiceDependencies
): Promise<{ id: string }> {
  const provider = await dependencies.getProvider(input.providerId);
  if (!provider) throw expectedActionError(t.errors.provider.notFound);

  const invoiceId = dependencies.newId();

  if ("amount" in input && input.amount !== undefined) {
    if (provider.type !== "servicio") {
      throw expectedActionError(t.errors.invoice.serviceNeedsServiceProvider);
    }

    await dependencies.insertServiceInvoice({
      id: invoiceId,
      providerId: input.providerId,
      date: input.date,
      number: input.number,
      notes: input.notes,
      amount: input.amount,
    });
    return { id: invoiceId };
  }

  if (provider.type !== "producto") {
    throw expectedActionError(t.errors.invoice.productNeedsProductProvider);
  }

  const productIds = [...new Set(input.lines.map((line) => line.productId))];
  const catalogRows = await dependencies.getCatalogProducts(input.providerId, productIds);
  const productById = new Map(catalogRows.map((row) => [row.productId, row]));

  const lines = input.lines.map((line) => {
    const product = productById.get(line.productId);
    if (product?.unitId == null) {
      throw expectedActionError(t.errors.invoice.lineProductNotForProvider);
    }
    return {
      ...line,
      unitId: product.unitId,
      total: multiplyDecimalStrings(line.unitPrice, line.quantity),
    };
  });

  const latestPriceByProduct = new Map<string, string>();
  for (const line of lines) {
    latestPriceByProduct.set(line.productId, line.unitPrice);
  }

  await dependencies.insertProductInvoice({
    id: invoiceId,
    providerId: input.providerId,
    date: input.date,
    number: input.number,
    notes: input.notes,
    total: sumDecimalStrings(lines.map((line) => line.total)),
    lines,
    latestPrices: [...latestPriceByProduct.entries()].map(([productId, price]) => ({
      productId,
      price,
    })),
  });

  return { id: invoiceId };
}
