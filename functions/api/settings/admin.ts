import type { ApiResponse } from '../../../src/types/index.ts';
import type { Env } from '../_shared.ts';
import {
  getAdminSettingsPayload,
  jsonResponse,
  optionsResponse,
  readSession,
  requireAdminSession,
} from '../_shared.ts';

export const onRequestOptions = async (): Promise<Response> => optionsResponse();

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const session = await readSession(context.request, context.env);
  const unauthorized = requireAdminSession(session);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const settings = await getAdminSettingsPayload(context.env.DB, context.env);

    return jsonResponse<typeof settings>({
      success: true,
      data: settings,
    });
  } catch (error) {
    return jsonResponse<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '获取管理员设置失败',
    }, { status: 500 });
  }
};
