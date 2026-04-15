import type { ApiResponse } from '../../../src/types/index.ts';
import type { Env } from '../_shared.ts';
import { getPublicSettingsPayload, jsonResponse, optionsResponse } from '../_shared.ts';

export const onRequestOptions = async (): Promise<Response> => optionsResponse();

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  try {
    const settings = await getPublicSettingsPayload(context.env.DB);

    return jsonResponse<typeof settings>({
      success: true,
      data: settings,
    });
  } catch (error) {
    return jsonResponse<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '获取设置失败',
    }, { status: 500 });
  }
};
