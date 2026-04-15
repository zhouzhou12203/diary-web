import type { ApiResponse } from '../../../src/types/index.ts';
import type { Env } from '../_shared.ts';
import { jsonResponse, optionsResponse, readSession } from '../_shared.ts';

type SessionResponse = {
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
};

export const onRequestOptions = async (): Promise<Response> => optionsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const session = await readSession(context.request, context.env);

  return jsonResponse<SessionResponse>({
    success: true,
    data: {
      isAuthenticated: session.isAuthenticated,
      isAdminAuthenticated: session.isAdminAuthenticated,
    },
  });
};
