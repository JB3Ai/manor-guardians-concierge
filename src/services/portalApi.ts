import { ResidencePortalData } from '../types/concierge';
import { apiRequest } from './httpApi';

export function getClientPortalSession(
  referenceCode: string,
  portalToken?: string,
  teamAccessToken?: string
): Promise<ResidencePortalData> {
  return apiRequest(`/api/portal/${encodeURIComponent(referenceCode)}`, {
    portalToken,
    teamAccessToken,
  });
}
