import "server-only";

import { fetchEsimAccessPlans } from "@/app/services/esimAccess";
import type { EsimPackage } from "@/app/types/esim";

export async function getPlans(): Promise<EsimPackage[]> {
  return fetchEsimAccessPlans();
}